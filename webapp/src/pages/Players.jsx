import { useEffect, useState } from 'react';
import client from '../api/client';
import { Users, Trash2, MessageSquare, Search, User as UserIcon } from 'lucide-react';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPlayers = async () => {
    try {
      const { data } = await client.get('/players');
      // Response is already unwrapped by interceptor
      setPlayers(data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load players');
      console.error('Error fetching players:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async (uuid, name) => {
    if (!confirm(`Kick ${name}?`)) return;

    try {
      await client.post(`/players/${uuid}/kick`, {
        reason: 'Kicked by administrator'
      });
      alert(`${name} has been kicked`);
      fetchPlayers();
    } catch (err) {
      alert(`Failed to kick player: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSendMessage = async (uuid, name) => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      await client.post(`/players/${uuid}/message`, { message });
      alert(`Message sent to ${name}`);
      setMessage('');
      setSelectedPlayer(null);
    } catch (err) {
      alert(`Failed to send message: ${err.response?.data?.message || err.message}`);
    }
  };

  const formatPlaytime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatLastSeen = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

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
    return <div className="text-white">Loading players...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Player Management</h1>
          <p className="text-gray-400">
            {onlinePlayers.length} online • {offlinePlayers.length} offline
          </p>
        </div>
        <button
          onClick={fetchPlayers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-dark-surface text-white rounded-lg border border-dark-border focus:border-blue-500 focus:outline-none"
        />
      </div>

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
                onMessage={(uuid, name) => {
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
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              className="w-full px-4 py-2 bg-dark-bg text-white rounded-lg border border-dark-border focus:border-blue-500 focus:outline-none mb-4"
              rows="4"
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

function PlayerCard({ player, onKick, onMessage, formatPlaytime, formatLastSeen }) {
  return (
    <div className="bg-dark-surface p-6 rounded-lg border border-dark-border hover:border-dark-hover transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-dark-bg rounded-lg flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{player.name}</h3>
            <p className="text-sm text-gray-400">
              Playtime: {formatPlaytime(player.totalPlaytime || 0)}
            </p>
            <p className="text-sm text-gray-500">
              {player.online ? 'Online now' : `Last seen: ${formatLastSeen(player.lastSeen)}`}
            </p>
          </div>
        </div>

        {player.online && (
          <div className="flex gap-2">
            <button
              onClick={() => onMessage(player.uuid, player.name)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Message
            </button>
            <button
              onClick={() => onKick(player.uuid, player.name)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Kick
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
