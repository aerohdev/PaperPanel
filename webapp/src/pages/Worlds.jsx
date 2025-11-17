import { useEffect, useState } from 'react';
import client from '../api/client';
import { Globe, Users, Boxes, Skull, RefreshCw } from 'lucide-react';

export default function Worlds() {
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorld, setSelectedWorld] = useState(null);

  useEffect(() => {
    fetchWorlds();
  }, []);

  const fetchWorlds = async () => {
    try {
      const { data } = await client.get('/worlds');
      setWorlds(data.worlds || []);
      setError(null);
    } catch (err) {
      setError('Failed to load worlds');
      console.error('Error fetching worlds:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    const hours = Math.floor(time / 1000) + 6;
    const displayHours = hours % 24;
    return `${displayHours.toString().padStart(2, '0')}:00`;
  };

  if (loading) {
    return <div className="text-white">Loading worlds...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">World Management</h1>
          <p className="text-gray-400">{worlds.length} world(s) loaded</p>
        </div>
        <button
          onClick={fetchWorlds}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* World Cards */}
      <div className="grid gap-4">
        {worlds.map(world => (
          <WorldCard
            key={world.name}
            world={world}
            formatTime={formatTime}
            onClick={() => setSelectedWorld(selectedWorld?.name === world.name ? null : world)}
            isExpanded={selectedWorld?.name === world.name}
          />
        ))}
      </div>

      {worlds.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No worlds found
        </div>
      )}
    </div>
  );
}

function WorldCard({ world, formatTime, onClick, isExpanded }) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'PEACEFUL': return 'text-green-400';
      case 'EASY': return 'text-yellow-400';
      case 'NORMAL': return 'text-orange-400';
      case 'HARD': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getEnvironmentIcon = (environment) => {
    switch (environment) {
      case 'NORMAL': return '🌍';
      case 'NETHER': return '🔥';
      case 'THE_END': return '🌌';
      default: return '🌍';
    }
  };

  return (
    <div className="bg-dark-surface p-6 rounded-lg border border-dark-border hover:border-dark-hover transition-colors">
      <div className="flex items-start justify-between cursor-pointer" onClick={onClick}>
        <div className="flex items-start gap-4 flex-1">
          <div className="text-4xl">{getEnvironmentIcon(world.environment)}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-2">{world.name}</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-sm">Environment</p>
                <p className="text-white font-medium">{world.environment}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Difficulty</p>
                <p className={`font-medium ${getDifficultyColor(world.difficulty)}`}>
                  {world.difficulty}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Time</p>
                <p className="text-white font-medium">{formatTime(world.time)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Weather</p>
                <p className="text-white font-medium">
                  {world.thundering ? '⚡ Thunder' : world.storm ? '🌧️ Rain' : '☀️ Clear'}
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{world.players} players</span>
              </div>
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{world.loadedChunks.toLocaleString()} chunks</span>
              </div>
              <div className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{world.entities} entities</span>
              </div>
            </div>
          </div>
        </div>

        <button className="text-gray-400 hover:text-white transition-colors">
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-dark-border space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Seed</p>
              <p className="text-white font-mono text-sm">{world.seed}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">PVP</p>
              <p className={`font-medium ${world.pvp ? 'text-red-400' : 'text-green-400'}`}>
                {world.pvp ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Spawn Location</p>
              <p className="text-white font-mono text-sm">
                {world.spawnLocation.x}, {world.spawnLocation.y}, {world.spawnLocation.z}
              </p>
            </div>
          </div>

          {/* Game Rules */}
          {world.gameRules && Object.keys(world.gameRules).length > 0 && (
            <div>
              <h4 className="text-white font-bold mb-2">Game Rules</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(world.gameRules).slice(0, 9).map(([rule, value]) => (
                  <div key={rule} className="bg-dark-bg p-2 rounded">
                    <p className="text-gray-400 text-xs">{rule}</p>
                    <p className="text-white text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
