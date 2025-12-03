import { useEffect, useState, ChangeEvent } from 'react';
import client from '../api/client';
import { Trash2, MessageSquare, Search, User as UserIcon, Ban, ShieldOff, RefreshCw, X } from 'lucide-react';
import type { PlayerInfo } from '../types/api';
import { PermissionTooltip } from '../components/PermissionTooltip';
import { Permission } from '../constants/permissions';
import { Card } from '../components/Card';
import { useToast } from '../contexts/ToastContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ScrollAnimatedItem } from '../components/ScrollAnimatedItem';

interface SelectedPlayer {
  uuid: string;
  name: string;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  variant: 'danger' | 'warning' | 'info';
}

export default function Players() {
  const { toast } = useToast();
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  const [message, setMessage] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'warning'
  });

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

  const handleKick = (uuid: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kick Player',
      message: `Kick ${name} from the server?`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await client.post(`/players/${uuid}/kick`, {
            reason: 'Kicked by administrator'
          });
          toast.success(`${name} has been kicked`);
          fetchPlayers();
        } catch (err: any) {
          toast.error(`Failed to kick player: ${err.response?.data?.message || err.message}`);
        }
      },
      variant: 'warning'
    });
  };

  const handleBan = (uuid: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Ban Player',
      message: `Ban ${name}? Reason: "Banned by administrator"`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await client.post(`/players/${uuid}/ban`, {
            reason: 'Banned by administrator'
          });
          toast.success(`${name} has been banned`);
          fetchPlayers();
        } catch (err: any) {
          toast.error(`Failed to ban player: ${err.response?.data?.message || err.message}`);
        }
      },
      variant: 'danger'
    });
  };

  const handleUnban = (uuid: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Unban Player',
      message: `Unban ${name}?`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await client.delete(`/players/${uuid}/ban`);
          toast.success(`${name} has been unbanned`);
          fetchPlayers();
        } catch (err: any) {
          toast.error(`Failed to unban player: ${err.response?.data?.message || err.message}`);
        }
      },
      variant: 'info'
    });
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
    return <Card className="text-white">Loading players...</Card>;
  }

  if (error) {
    return <Card className="text-red-500">{error}</Card>;
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        variant={confirmDialog.variant}
      />

      <div className="space-y-6">
      <ScrollAnimatedItem delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Player Management</h1>
            <p className="text-gray-300">
              {onlinePlayers.length} online • {offlinePlayers.length} offline
            </p>
          </div>
          <button
            onClick={fetchPlayers}
            className="
              flex items-center gap-2 px-4 py-2
              bg-white/5 backdrop-blur-xl
              hover:bg-white/10
              text-white
              rounded-xl
              transition-all duration-300
              border border-white/10
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </ScrollAnimatedItem>

      {/* Search Bar */}
      <ScrollAnimatedItem delay={0.1}>
        <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900/40 backdrop-blur-xl text-white placeholder-gray-500 rounded-xl border border-white/20 focus:border-primary-500 focus:outline-none transition-colors"
          />
        </div>
      </Card>
      </ScrollAnimatedItem>

      {/* Online Players */}
      {onlinePlayers.length > 0 && (
        <ScrollAnimatedItem delay={0.2}>
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
        </ScrollAnimatedItem>
      )}

      {/* Offline Players */}
      {offlinePlayers.length > 0 && (
        <ScrollAnimatedItem delay={0.3}>
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
        </ScrollAnimatedItem>
      )}

      {filteredPlayers.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No players found
        </div>
      )}

      {/* Message Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="
            bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40
            backdrop-blur-3xl backdrop-saturate-150
            border border-white/20
            rounded-2xl
            shadow-[0_20px_60px_0_rgba(0,0,0,0.7),0_0_80px_0_rgba(138,92,246,0.2),inset_0_1px_0_0_rgba(255,255,255,0.2)]
            max-w-md w-full
            animate-scale-in
          ">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">
                Send Message to {selectedPlayer.name}
              </h3>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            <div className="p-6">
              <textarea
                value={message}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                className="w-full px-4 py-2 bg-gray-900/40 backdrop-blur-xl text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="flex-1 px-4 py-2
                  bg-white/5 backdrop-blur-xl
                  text-white
                  rounded-xl
                  hover:bg-white/10
                  transition-colors
                  border border-white/10
                  font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendMessage(selectedPlayer.uuid, selectedPlayer.name)}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors font-medium shadow-lg"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
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
    <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] p-6 rounded-lg hover:border-white/40 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-900/40 backdrop-blur-xl rounded-lg flex items-center justify-center">
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
                  <span className="px-2 py-1 bg-gray-900/40 backdrop-blur-xl text-gray-400 rounded">
                    ⛏️ {player.stats.BLOCKS_BROKEN.toLocaleString()} blocks broken
                  </span>
                )}
                {player.stats.BLOCKS_PLACED && (
                  <span className="px-2 py-1 bg-gray-900/40 backdrop-blur-xl text-gray-400 rounded">
                    🧱 {player.stats.BLOCKS_PLACED.toLocaleString()} blocks placed
                  </span>
                )}
                {player.stats.DEATHS && (
                  <span className="px-2 py-1 bg-gray-900/40 backdrop-blur-xl text-gray-400 rounded">
                    💀 {player.stats.DEATHS} deaths
                  </span>
                )}
                {player.stats.JOINS && (
                  <span className="px-2 py-1 bg-gray-900/40 backdrop-blur-xl text-gray-400 rounded">
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
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-lg hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
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
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-orange-600/80 via-orange-700/80 to-orange-600/80 backdrop-blur-xl text-white rounded-lg hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 transition-colors border border-orange-500/50 shadow-[0_4px_16px_0_rgba(249,115,22,0.3)]"
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
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-red-600/80 via-red-700/80 to-red-600/80 backdrop-blur-xl text-white rounded-lg hover:from-red-600 hover:via-red-700 hover:to-red-600 transition-colors border border-red-500/50 shadow-[0_4px_16px_0_rgba(239,68,68,0.3)]"
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
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-green-600/80 via-green-700/80 to-green-600/80 backdrop-blur-xl text-white rounded-lg hover:from-green-600 hover:via-green-700 hover:to-green-600 transition-colors border border-green-500/50 shadow-[0_4px_16px_0_rgba(34,197,94,0.3)]"
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
