import { useEffect, useState } from 'react';
import client from '../api/client';
import { Globe, Users, Boxes, Skull, RefreshCw, Settings, Sun, Moon, Cloud, CloudRain, Zap, Save, ChevronDown, ChevronUp } from 'lucide-react';
import type { WorldInfo } from '../types/api';

export default function Worlds() {
  const [worlds, setWorlds] = useState<WorldInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWorld, setExpandedWorld] = useState<string | null>(null);

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

  const handleToggleSetting = async (worldName: string, setting: string, currentValue: boolean) => {
    try {
      await client.put(`/worlds/${worldName}/settings`, {
        [setting]: !currentValue
      });
      await fetchWorlds();
    } catch (err: any) {
      alert(`Failed to update world setting: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSetTime = async (worldName: string, time: string) => {
    try {
      await client.post(`/worlds/${worldName}/time/${time}`);
      await fetchWorlds();
    } catch (err: any) {
      alert(`Failed to set time: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSetWeather = async (worldName: string, weather: string) => {
    try {
      await client.post(`/worlds/${worldName}/weather/${weather}`);
      await fetchWorlds();
    } catch (err: any) {
      alert(`Failed to set weather: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSetDifficulty = async (worldName: string, difficulty: string) => {
    try {
      await client.post(`/worlds/${worldName}/difficulty/${difficulty}`);
      await fetchWorlds();
    } catch (err: any) {
      alert(`Failed to set difficulty: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSaveWorld = async (worldName: string) => {
    try {
      await client.post(`/worlds/${worldName}/save`);
      alert(`World "${worldName}" saved successfully!`);
    } catch (err: any) {
      alert(`Failed to save world: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleToggleGameRule = async (worldName: string, rule: string, currentValue: boolean) => {
    try {
      await client.post(`/worlds/${worldName}/gamerule`, {
        rule,
        value: !currentValue
      });
      await fetchWorlds();
    } catch (err: any) {
      alert(`Failed to update game rule: ${err.response?.data?.message || err.message}`);
    }
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                    <button
                      onClick={() => handleToggleSetting(world.name, 'pvp', world.pvp)}
                      className={`px-3 py-2 rounded transition-colors hover:opacity-80 ${world.pvp ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}
                    >
                      PVP: {world.pvp ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleToggleSetting(world.name, 'allowAnimals', world.allowAnimals)}
                      className={`px-3 py-2 rounded transition-colors hover:opacity-80 ${world.allowAnimals ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}
                    >
                      Animals: {world.allowAnimals ? 'Yes' : 'No'}
                    </button>
                    <button
                      onClick={() => handleToggleSetting(world.name, 'allowMonsters', world.allowMonsters)}
                      className={`px-3 py-2 rounded transition-colors hover:opacity-80 ${world.allowMonsters ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}
                    >
                      Monsters: {world.allowMonsters ? 'Yes' : 'No'}
                    </button>
                    <button
                      onClick={() => handleToggleSetting(world.name, 'hardcore', world.hardcore)}
                      className={`px-3 py-2 rounded transition-colors hover:opacity-80 ${world.hardcore ? 'bg-red-900/30 text-red-400' : 'bg-gray-700 text-gray-400'}`}
                    >
                      Hardcore: {world.hardcore ? 'Yes' : 'No'}
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => handleSetTime(world.name, 'day')}
                      className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                    >
                      <Sun className="w-4 h-4" />
                      Set Day
                    </button>
                    <button
                      onClick={() => handleSetTime(world.name, 'night')}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                    >
                      <Moon className="w-4 h-4" />
                      Set Night
                    </button>
                    <button
                      onClick={() => handleSetWeather(world.name, 'clear')}
                      className="flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm"
                    >
                      <Sun className="w-4 h-4" />
                      Clear Weather
                    </button>
                    <button
                      onClick={() => handleSetWeather(world.name, 'rain')}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      <CloudRain className="w-4 h-4" />
                      Rain
                    </button>
                    <button
                      onClick={() => handleSaveWorld(world.name)}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Save className="w-4 h-4" />
                      Save World
                    </button>
                  </div>

                  {/* Advanced Options Toggle */}
                  <button
                    onClick={() => setExpandedWorld(expandedWorld === world.name ? null : world.name)}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm mb-3"
                  >
                    {expandedWorld === world.name ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Advanced Options
                  </button>

                  {/* Advanced Options Panel */}
                  {expandedWorld === world.name && world.gameRules && (
                    <div className="bg-dark-bg p-4 rounded-lg border border-dark-border space-y-3">
                      <h4 className="text-white font-semibold mb-3">Game Rules</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Difficulty */}
                        <div>
                          <label className="text-gray-400 text-sm mb-2 block">Difficulty</label>
                          <select
                            value={world.difficulty}
                            onChange={(e) => handleSetDifficulty(world.name, e.target.value)}
                            className="w-full px-3 py-2 bg-dark-surface text-white rounded border border-dark-border focus:border-blue-500 focus:outline-none"
                          >
                            <option value="PEACEFUL">Peaceful</option>
                            <option value="EASY">Easy</option>
                            <option value="NORMAL">Normal</option>
                            <option value="HARD">Hard</option>
                          </select>
                        </div>

                        {/* Common Game Rules */}
                        {world.gameRules.doDaylightCycle !== undefined && (
                          <div className="flex items-center justify-between p-2 bg-dark-surface rounded">
                            <span className="text-gray-300 text-sm">Daylight Cycle</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'doDaylightCycle', world.gameRules.doDaylightCycle)}
                              className={`px-3 py-1 rounded text-xs ${world.gameRules.doDaylightCycle ? 'bg-green-600' : 'bg-gray-600'} text-white`}
                            >
                              {world.gameRules.doDaylightCycle ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}

                        {world.gameRules.doWeatherCycle !== undefined && (
                          <div className="flex items-center justify-between p-2 bg-dark-surface rounded">
                            <span className="text-gray-300 text-sm">Weather Cycle</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'doWeatherCycle', world.gameRules.doWeatherCycle)}
                              className={`px-3 py-1 rounded text-xs ${world.gameRules.doWeatherCycle ? 'bg-green-600' : 'bg-gray-600'} text-white`}
                            >
                              {world.gameRules.doWeatherCycle ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}

                        {world.gameRules.keepInventory !== undefined && (
                          <div className="flex items-center justify-between p-2 bg-dark-surface rounded">
                            <span className="text-gray-300 text-sm">Keep Inventory</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'keepInventory', world.gameRules.keepInventory)}
                              className={`px-3 py-1 rounded text-xs ${world.gameRules.keepInventory ? 'bg-green-600' : 'bg-gray-600'} text-white`}
                            >
                              {world.gameRules.keepInventory ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}

                        {world.gameRules.mobGriefing !== undefined && (
                          <div className="flex items-center justify-between p-2 bg-dark-surface rounded">
                            <span className="text-gray-300 text-sm">Mob Griefing</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'mobGriefing', world.gameRules.mobGriefing)}
                              className={`px-3 py-1 rounded text-xs ${world.gameRules.mobGriefing ? 'bg-green-600' : 'bg-gray-600'} text-white`}
                            >
                              {world.gameRules.mobGriefing ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}

                        {world.gameRules.doMobSpawning !== undefined && (
                          <div className="flex items-center justify-between p-2 bg-dark-surface rounded">
                            <span className="text-gray-300 text-sm">Mob Spawning</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'doMobSpawning', world.gameRules.doMobSpawning)}
                              className={`px-3 py-1 rounded text-xs ${world.gameRules.doMobSpawning ? 'bg-green-600' : 'bg-gray-600'} text-white`}
                            >
                              {world.gameRules.doMobSpawning ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}

                        {world.gameRules.naturalRegeneration !== undefined && (
                          <div className="flex items-center justify-between p-2 bg-dark-surface rounded">
                            <span className="text-gray-300 text-sm">Natural Regeneration</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'naturalRegeneration', world.gameRules.naturalRegeneration)}
                              className={`px-3 py-1 rounded text-xs ${world.gameRules.naturalRegeneration ? 'bg-green-600' : 'bg-gray-600'} text-white`}
                            >
                              {world.gameRules.naturalRegeneration ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}

                        {world.gameRules.doFireTick !== undefined && (
                          <div className="flex items-center justify-between p-2 bg-dark-surface rounded">
                            <span className="text-gray-300 text-sm">Fire Tick</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'doFireTick', world.gameRules.doFireTick)}
                              className={`px-3 py-1 rounded text-xs ${world.gameRules.doFireTick ? 'bg-green-600' : 'bg-gray-600'} text-white`}
                            >
                              {world.gameRules.doFireTick ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}

                        {world.gameRules.doImmediateRespawn !== undefined && (
                          <div className="flex items-center justify-between p-2 bg-dark-surface rounded">
                            <span className="text-gray-300 text-sm">Immediate Respawn</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'doImmediateRespawn', world.gameRules.doImmediateRespawn)}
                              className={`px-3 py-1 rounded text-xs ${world.gameRules.doImmediateRespawn ? 'bg-green-600' : 'bg-gray-600'} text-white`}
                            >
                              {world.gameRules.doImmediateRespawn ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
