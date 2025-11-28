import { useEffect, useState, ChangeEvent } from 'react';
import client from '../api/client';
import { Trash2, MessageSquare, Search, User as UserIcon, Ban, ShieldOff } from 'lucide-react';
import type { PlayerInfo } from '../types/api';
import { PermissionTooltip } from '../components/PermissionTooltip';
import { Permission } from '../constants/permissions';
import { Card } from '../components/Card';
import { useToast } from '../contexts/ToastContext';

interface SelectedPlayer {
  uuid: string;
  name: string;
}

export default function Players() {
  const { toast } = useToast();
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPlayers = async () => {
    try {
      const { data } = await client.get<PlayerInfo[]>('/players');
      // Ensure data is an array
      const playersArray = Array.isArray(data) ? data : [];
      setPlayers(playersArray);
      setError(null);
    } catch (err: any) {
      setError('Failed to load players');
      console.error('Error fetching players:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async (uuid: string, name: string) => {
    if (!confirm(`Kick ${name} from the server?`)) return;

    try {
      await client.post(`/players/${uuid}/kick`, {
        reason: 'Kicked by administrator'
      });
      toast.success(`${name} has been kicked`);
      fetchPlayers();
    } catch (err: any) {
      toast.error(`Failed to kick player: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleBan = async (uuid: string, name: string) => {
    const reason = prompt(`Enter ban reason for ${name}:`, 'Banned by administrator');
    if (reason === null) return; // User cancelled

    try {
      await client.post(`/players/${uuid}/ban`, {
        reason: reason || 'Banned by administrator'
      });
      toast.success(`${name} has been banned`);
      fetchPlayers();
    } catch (err: any) {
      toast.error(`Failed to ban player: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleUnban = async (uuid: string, name: string) => {
    if (!confirm(`Unban ${name}?`)) return;

    try {
      await client.delete(`/players/${uuid}/ban`);
      toast.success(`${name} has been unbanned`);
      fetchPlayers();
    } catch (err: any) {
      toast.error(`Failed to unban player: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSendMessage = async (uuid: string, name: string) => {
    if (!message.trim()) {
      toast.warning('Please enter a message');
      return;
    }

    try {
      await client.post(`/players/${uuid}/message`, { message });
      toast.success(`Message sent to ${name}`);
      setMessage('');
      setSelectedPlayer(null);
    } catch (err: any) {
      toast.error(`Failed to send message: ${err.response?.data?.message || err.message}`);
    }
  };

  const formatPlaytime = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatLastSeen = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlinePlayers = filteredPlayers.filter(p => p.online);
  const offlinePlayers = filteredPlayers.filter(p => !p.online);

  if (loading) {
    return <Card className="text-light-text-primary dark:text-dark-text-primary">Loading players...</Card>;
  }

  if (error) {
    return <Card className="text-red-500">{error}</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Player Management</h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            {onlinePlayers.length} online • {offlinePlayers.length} offline
          </p>
        </div>
        <button
          onClick={fetchPlayers}
          className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary rounded-xl border border-light-border dark:border-dark-border focus:border-primary-500 focus:outline-none transition-colors"
          />
        </div>
      </Card>

      {/* Online Players */}
      {onlinePlayers.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            Online Players ({onlinePlayers.length})
          </h2>
          <div className="grid gap-4">
            {onlinePlayers.map(player => (
              <PlayerCard
                key={player.uuid}
                player={player}
                onKick={handleKick}
                onBan={handleBan}
                onUnban={handleUnban}
                onMessage={(uuid: string, name: string) => {
                  setSelectedPlayer({ uuid, name });
                  setMessage('');
                }}
                formatPlaytime={formatPlaytime}
                formatLastSeen={formatLastSeen}
              />
            ))}
          </div>
        </div>
      )}

      {/* Offline Players */}
      {offlinePlayers.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            Offline Players ({offlinePlayers.length})
          </h2>
          <div className="grid gap-4">
            {offlinePlayers.map(player => (
              <PlayerCard
                key={player.uuid}
                player={player}
                onBan={handleBan}
                onUnban={handleUnban}
                formatPlaytime={formatPlaytime}
                formatLastSeen={formatLastSeen}
              />
            ))}
          </div>
        </div>
      )}

      {filteredPlayers.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No players found
        </div>
      )}

      {/* Message Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-surface p-6 rounded-lg max-w-md w-full border border-dark-border">
            <h3 className="text-xl font-bold text-white mb-4">
              Send Message to {selectedPlayer.name}
            </h3>
            <textarea
              value={message}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              className="w-full px-4 py-2 bg-dark-bg text-white rounded-lg border border-dark-border focus:border-blue-500 focus:outline-none mb-4"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleSendMessage(selectedPlayer.uuid, selectedPlayer.name)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send
              </button>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PlayerCardProps {
  player: PlayerInfo;
  onKick?: (uuid: string, name: string) => void;
  onBan?: (uuid: string, name: string) => void;
  onUnban?: (uuid: string, name: string) => void;
  onMessage?: (uuid: string, name: string) => void;
  formatPlaytime: (ms: number) => string;
  formatLastSeen: (timestamp: number) => string;
}

function PlayerCard({ player, onKick, onBan, onUnban, onMessage, formatPlaytime, formatLastSeen }: PlayerCardProps) {
  return (
    <div className="bg-dark-surface p-6 rounded-lg border border-dark-border hover:border-dark-hover transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-dark-bg rounded-lg flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-white">{player.name}</h3>
              {player.banned && (
                <span className="px-2 py-1 text-xs font-medium bg-red-900/30 text-red-400 border border-red-500 rounded">
                  BANNED
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">
              Playtime: {formatPlaytime(player.totalPlaytime || 0)}
            </p>
            <p className="text-sm text-gray-500">
              {player.online ? 'Online now' : `Last seen: ${formatLastSeen(player.lastSeen || 0)}`}
            </p>
            {player.stats && Object.keys(player.stats).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {player.stats.BLOCKS_BROKEN && (
                  <span className="px-2 py-1 bg-dark-bg text-gray-400 rounded">
                    ⛏️ {player.stats.BLOCKS_BROKEN.toLocaleString()} blocks broken
                  </span>
                )}
                {player.stats.BLOCKS_PLACED && (
                  <span className="px-2 py-1 bg-dark-bg text-gray-400 rounded">
                    🧱 {player.stats.BLOCKS_PLACED.toLocaleString()} blocks placed
                  </span>
                )}
                {player.stats.DEATHS && (
                  <span className="px-2 py-1 bg-dark-bg text-gray-400 rounded">
                    💀 {player.stats.DEATHS} deaths
                  </span>
                )}
                {player.stats.JOINS && (
                  <span className="px-2 py-1 bg-dark-bg text-gray-400 rounded">
                    🚪 {player.stats.JOINS} joins
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {(player.online && onKick && onMessage) || onBan || onUnban ? (
          <div className="flex gap-2 flex-wrap">
            {player.online && onMessage && (
              <PermissionTooltip permission={Permission.MESSAGE_PLAYERS}>
                <button
                  onClick={() => onMessage(player.uuid, player.name)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
              </PermissionTooltip>
            )}
            {player.online && onKick && (
              <PermissionTooltip permission={Permission.KICK_PLAYERS}>
                <button
                  onClick={() => onKick(player.uuid, player.name)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Kick
                </button>
              </PermissionTooltip>
            )}
            {!player.banned && onBan && (
              <PermissionTooltip permission={Permission.BAN_PLAYERS}>
                <button
                  onClick={() => onBan(player.uuid, player.name)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  Ban
                </button>
              </PermissionTooltip>
            )}
            {player.banned && onUnban && (
              <PermissionTooltip permission={Permission.BAN_PLAYERS}>
                <button
                  onClick={() => onUnban(player.uuid, player.name)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ShieldOff className="w-4 h-4" />
                  Unban
                </button>
              </PermissionTooltip>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
