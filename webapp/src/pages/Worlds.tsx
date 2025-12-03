import { useEffect, useState } from 'react';
import client from '../api/client';
import { Globe, Users, Boxes, Skull, RefreshCw, Settings, Sun, Moon, Cloud, CloudRain, Zap, Save, ChevronDown, ChevronUp } from 'lucide-react';
import type { WorldInfo } from '../types/api';
import { Card } from '../components/Card';
import { useToast } from '../contexts/ToastContext';
import { ScrollAnimatedItem } from '../components/ScrollAnimatedItem';

export default function Worlds() {
  const { toast } = useToast();
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
      toast.success(`${setting} updated successfully`);
    } catch (err: any) {
      toast.error(`Failed to update world setting: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSetTime = async (worldName: string, time: string) => {
    try {
      await client.post(`/worlds/${worldName}/time/${time}`);
      await fetchWorlds();
      toast.success(`Time set to ${time} in ${worldName}`);
    } catch (err: any) {
      toast.error(`Failed to set time: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSetWeather = async (worldName: string, weather: string) => {
    try {
      await client.post(`/worlds/${worldName}/weather/${weather}`);
      await fetchWorlds();
      toast.success(`Weather set to ${weather} in ${worldName}`);
    } catch (err: any) {
      toast.error(`Failed to set weather: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSetDifficulty = async (worldName: string, difficulty: string) => {
    try {
      await client.post(`/worlds/${worldName}/difficulty/${difficulty}`);
      await fetchWorlds();
      toast.success(`Difficulty set to ${difficulty} in ${worldName}`);
    } catch (err: any) {
      toast.error(`Failed to set difficulty: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSaveWorld = async (worldName: string) => {
    try {
      await client.post(`/worlds/${worldName}/save`);
      toast.success(`World "${worldName}" saved successfully!`);
    } catch (err: any) {
      toast.error(`Failed to save world: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleToggleGameRule = async (worldName: string, rule: string, currentValue: boolean) => {
    try {
      await client.post(`/worlds/${worldName}/gamerule`, {
        rule,
        value: !currentValue
      });
      await fetchWorlds();
      toast.success(`Game rule ${rule} updated`);
    } catch (err: any) {
      toast.error(`Failed to update game rule: ${err.response?.data?.message || err.message}`);
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

      {/* World Cards */}
      <div className="grid gap-4">
        {worlds.map((world, index) => (
          <ScrollAnimatedItem key={world.name} delay={index * 0.1}>
          <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 p-6 rounded-lg border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-colors">
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
                    <button
                      onClick={() => handleToggleSetting(world.name, 'allowAnimals', world.allowAnimals)}
                      className={`px-3 py-2 rounded-xl transition-colors font-medium ${
                        world.allowAnimals
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
                          : 'bg-gray-900/40 backdrop-blur-xl text-gray-300 border border-white/20 hover:bg-white/10'
                      }`}
                    >
                      Animals: {world.allowAnimals ? 'Yes' : 'No'}
                    </button>
                    <button
                      onClick={() => handleToggleSetting(world.name, 'allowMonsters', world.allowMonsters)}
                      className={`px-3 py-2 rounded-xl transition-colors font-medium ${
                        world.allowMonsters
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
                          : 'bg-gray-900/40 backdrop-blur-xl text-gray-300 border border-white/20 hover:bg-white/10'
                      }`}
                    >
                      Monsters: {world.allowMonsters ? 'Yes' : 'No'}
                    </button>
                    <button
                      onClick={() => handleToggleSetting(world.name, 'hardcore', world.hardcore)}
                      className={`px-3 py-2 rounded-xl transition-colors font-medium ${
                        world.hardcore
                          ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                          : 'bg-gray-900/40 backdrop-blur-xl text-gray-300 border border-white/20 hover:bg-white/10'
                      }`}
                    >
                      Hardcore: {world.hardcore ? 'Yes' : 'No'}
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <button
                      onClick={() => handleSetTime(world.name, 'day')}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors text-sm font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
                    >
                      <Sun className="w-4 h-4" />
                      Set Day
                    </button>
                    <button
                      onClick={() => handleSetTime(world.name, 'night')}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors text-sm font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
                    >
                      <Moon className="w-4 h-4" />
                      Set Night
                    </button>
                    <button
                      onClick={() => handleSetWeather(world.name, 'clear')}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors text-sm font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
                    >
                      <Sun className="w-4 h-4" />
                      Clear Weather
                    </button>
                    <button
                      onClick={() => handleSetWeather(world.name, 'rain')}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors text-sm font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
                    >
                      <CloudRain className="w-4 h-4" />
                      Rain
                    </button>
                    <button
                      onClick={() => handleSaveWorld(world.name)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-br from-emerald-600/80 via-emerald-700/80 to-emerald-600/80 backdrop-blur-xl text-white rounded-xl hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-600 transition-colors text-sm font-medium border border-emerald-500/50 shadow-[0_4px_16px_0_rgba(16,185,129,0.3)]"
                    >
                      <Save className="w-4 h-4" />
                      Save World
                    </button>
                  </div>

                  {/* Advanced Options Toggle */}
                  <button
                    onClick={() => setExpandedWorld(expandedWorld === world.name ? null : world.name)}
                    className="flex items-center gap-2 text-primary-500 hover:text-accent-purple transition-colors text-sm mb-3 font-medium"
                  >
                    {expandedWorld === world.name ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Advanced Options
                  </button>

                  {/* Advanced Options Panel */}
                  {expandedWorld === world.name && world.gameRules && (
                    <div className="bg-black/30 backdrop-blur-xl p-4 rounded-lg border border-white/10 space-y-3">
                      <h4 className="text-white font-semibold mb-3">Game Rules</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Difficulty */}
                        <div>
                          <label className="text-gray-400 text-sm mb-2 block">Difficulty</label>
                          <select
                            value={world.difficulty}
                            onChange={(e) => handleSetDifficulty(world.name, e.target.value)}
                            className="w-full px-3 py-2 bg-gray-900/40 backdrop-blur-xl text-white rounded border border-white/20 focus:border-blue-500 focus:outline-none [&>option]:bg-gray-900 [&>option]:text-white"
                          >
                            <option value="PEACEFUL">Peaceful</option>
                            <option value="EASY">Easy</option>
                            <option value="NORMAL">Normal</option>
                            <option value="HARD">Hard</option>
                          </select>
                        </div>

                        {/* Common Game Rules */}
                        {world.gameRules.doDaylightCycle !== undefined && (
                          <div className="flex items-center justify-between p-3 bg-gray-900/40 backdrop-blur-xl rounded-xl border border-white/20">
                            <span className="text-gray-300 text-sm font-medium">Daylight Cycle</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'doDaylightCycle', world.gameRules.doDaylightCycle)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                world.gameRules.doDaylightCycle
                                  ? 'bg-gradient-to-br from-emerald-600/80 via-emerald-700/80 to-emerald-600/80 backdrop-blur-xl text-white border border-emerald-500/50 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-600'
                                  : 'bg-gray-900/60 text-gray-300 hover:bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
                              }`}
                            >
                              {world.gameRules.doDaylightCycle ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}

                        {world.gameRules.doWeatherCycle !== undefined && (
                          <div className="flex items-center justify-between p-3 bg-gray-900/40 backdrop-blur-xl rounded-xl border border-white/20">
                            <span className="text-gray-300 text-sm font-medium">Weather Cycle</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'doWeatherCycle', world.gameRules.doWeatherCycle)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                world.gameRules.doWeatherCycle
                                  ? 'bg-gradient-to-br from-emerald-600/80 via-emerald-700/80 to-emerald-600/80 backdrop-blur-xl text-white border border-emerald-500/50 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-600'
                                  : 'bg-gray-900/60 text-gray-300 hover:bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
                              }`}
                            >
                              {world.gameRules.doWeatherCycle ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}

                        {world.gameRules.keepInventory !== undefined && (
                          <div className="flex items-center justify-between p-3 bg-gray-900/40 backdrop-blur-xl rounded-xl border border-white/20">
                            <span className="text-gray-300 text-sm font-medium">Keep Inventory</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'keepInventory', world.gameRules.keepInventory)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                world.gameRules.keepInventory
                                  ? 'bg-gradient-to-br from-emerald-600/80 via-emerald-700/80 to-emerald-600/80 backdrop-blur-xl text-white border border-emerald-500/50 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-600'
                                  : 'bg-gray-900/60 text-gray-300 hover:bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
                              }`}
                            >
                              {world.gameRules.keepInventory ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}

                        {world.gameRules.mobGriefing !== undefined && (
                          <div className="flex items-center justify-between p-3 bg-gray-900/40 backdrop-blur-xl rounded-xl border border-white/20">
                            <span className="text-gray-300 text-sm font-medium">Mob Griefing</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'mobGriefing', world.gameRules.mobGriefing)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                world.gameRules.mobGriefing
                                  ? 'bg-gradient-to-br from-emerald-600/80 via-emerald-700/80 to-emerald-600/80 backdrop-blur-xl text-white border border-emerald-500/50 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-600'
                                  : 'bg-gray-900/60 text-gray-300 hover:bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
                              }`}
                            >
                              {world.gameRules.mobGriefing ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}

                        {world.gameRules.doMobSpawning !== undefined && (
                          <div className="flex items-center justify-between p-3 bg-gray-900/40 backdrop-blur-xl rounded-xl border border-white/20">
                            <span className="text-gray-300 text-sm font-medium">Mob Spawning</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'doMobSpawning', world.gameRules.doMobSpawning)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                world.gameRules.doMobSpawning
                                  ? 'bg-gradient-to-br from-emerald-600/80 via-emerald-700/80 to-emerald-600/80 backdrop-blur-xl text-white border border-emerald-500/50 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-600'
                                  : 'bg-gray-900/60 text-gray-300 hover:bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
                              }`}
                            >
                              {world.gameRules.doMobSpawning ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}

                        {world.gameRules.naturalRegeneration !== undefined && (
                          <div className="flex items-center justify-between p-3 bg-gray-900/40 backdrop-blur-xl rounded-xl border border-white/20">
                            <span className="text-gray-300 text-sm font-medium">Natural Regeneration</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'naturalRegeneration', world.gameRules.naturalRegeneration)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                world.gameRules.naturalRegeneration
                                  ? 'bg-gradient-to-br from-emerald-600/80 via-emerald-700/80 to-emerald-600/80 backdrop-blur-xl text-white border border-emerald-500/50 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-600'
                                  : 'bg-gray-900/60 text-gray-300 hover:bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
                              }`}
                            >
                              {world.gameRules.naturalRegeneration ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}

                        {world.gameRules.doFireTick !== undefined && (
                          <div className="flex items-center justify-between p-3 bg-gray-900/40 backdrop-blur-xl rounded-xl border border-white/20">
                            <span className="text-gray-300 text-sm font-medium">Fire Tick</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'doFireTick', world.gameRules.doFireTick)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                world.gameRules.doFireTick
                                  ? 'bg-gradient-to-br from-emerald-600/80 via-emerald-700/80 to-emerald-600/80 backdrop-blur-xl text-white border border-emerald-500/50 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-600'
                                  : 'bg-gray-900/60 text-gray-300 hover:bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
                              }`}
                            >
                              {world.gameRules.doFireTick ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        )}

                        {world.gameRules.doImmediateRespawn !== undefined && (
                          <div className="flex items-center justify-between p-3 bg-gray-900/40 backdrop-blur-xl rounded-xl border border-white/20">
                            <span className="text-gray-300 text-sm font-medium">Immediate Respawn</span>
                            <button
                              onClick={() => handleToggleGameRule(world.name, 'doImmediateRespawn', world.gameRules.doImmediateRespawn)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                world.gameRules.doImmediateRespawn
                                  ? 'bg-gradient-to-br from-emerald-600/80 via-emerald-700/80 to-emerald-600/80 backdrop-blur-xl text-white border border-emerald-500/50 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-600'
                                  : 'bg-gray-900/60 text-gray-300 hover:bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
                              }`}
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
          </ScrollAnimatedItem>
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
