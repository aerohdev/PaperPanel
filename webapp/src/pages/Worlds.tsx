import { useEffect, useState } from 'react';
import client from '../api/client';
import { Globe, Users, Boxes, Skull, RefreshCw, Settings, Sun, Moon } from 'lucide-react';
import type { WorldInfo } from '../types/api';

export default function Worlds() {
  const [worlds, setWorlds] = useState<WorldInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorlds();
  }, []);

  const fetchWorlds = async () => {
    try {
      const { data } = await client.get<WorldInfo[]>('/worlds');
      setWorlds(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError('Failed to load worlds');
      console.error('Error fetching worlds:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 1000) + 6;
    const displayHours = hours % 24;
    return `${displayHours.toString().padStart(2, '0')}:00`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'PEACEFUL': return 'text-green-400';
      case 'EASY': return 'text-yellow-400';
      case 'NORMAL': return 'text-orange-400';
      case 'HARD': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getEnvironmentIcon = (environment: string): string => {
    switch (environment) {
      case 'NORMAL': return '🌍';
      case 'NETHER': return '🔥';
      case 'THE_END': return '🌌';
      default: return '🌍';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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
          <div key={world.name} className="bg-dark-surface p-6 rounded-lg border border-dark-border hover:border-dark-hover transition-colors">
            <div className="flex items-start justify-between">
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

                  <div className="flex gap-6 mb-4">
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

                  {/* World Settings */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className={`px-3 py-2 rounded ${world.pvp ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                      PVP: {world.pvp ? 'Enabled' : 'Disabled'}
                    </div>
                    <div className={`px-3 py-2 rounded ${world.allowAnimals ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                      Animals: {world.allowAnimals ? 'Yes' : 'No'}
                    </div>
                    <div className={`px-3 py-2 rounded ${world.allowMonsters ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                      Monsters: {world.allowMonsters ? 'Yes' : 'No'}
                    </div>
                    <div className={`px-3 py-2 rounded ${world.hardcore ? 'bg-red-900/30 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                      Hardcore: {world.hardcore ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
