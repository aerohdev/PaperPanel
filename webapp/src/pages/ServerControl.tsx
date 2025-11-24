import { useState, useEffect, ChangeEvent } from 'react';
import client from '../api/client';
import { Server, Power, Save, CloudRain, Sun, Moon, Clock } from 'lucide-react';
import type { WorldInfo } from '../types/api';
import { PermissionTooltip } from '../components/PermissionTooltip';
import { Permission } from '../constants/permissions';
import { Card } from '../components/Card';
import { motion } from 'framer-motion';

export default function ServerControl() {
  const [restartDelay, setRestartDelay] = useState<number>(300);
  const [worlds, setWorlds] = useState<WorldInfo[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<string>('world');

  useEffect(() => {
    fetchWorlds();
  }, []);

  const fetchWorlds = async () => {
    try {
      const { data } = await client.get<WorldInfo[]>('/worlds');
      const worldsArray = Array.isArray(data) ? data : [];
      setWorlds(worldsArray);
      if (worldsArray.length > 0) {
        setSelectedWorld(worldsArray[0].name);
      }
    } catch (err) {
      console.error('Error fetching worlds:', err);
    }
  };

  const handleRestart = async () => {
    if (!confirm(`Schedule server restart in ${restartDelay} seconds?`)) return;

    try {
      await client.post(`/server/restart?delay=${restartDelay}`);
      alert(`Server restart scheduled in ${restartDelay} seconds. Players will see countdown warnings.`);
    } catch (err: any) {
      alert(`Failed to schedule restart: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleStop = async () => {
    if (!confirm('Stop the server immediately? This will disconnect all players!')) return;

    try {
      await client.post('/server/stop');
      alert('Server is stopping...');
    } catch (err: any) {
      alert(`Failed to stop server: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSaveAll = async () => {
    try {
      await client.post('/server/save-all');
      alert('All worlds saved successfully!');
    } catch (err: any) {
      alert(`Failed to save worlds: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleWeather = async (type: string) => {
    try {
      await client.post(`/server/weather/${selectedWorld}/${type}`);
      alert(`Weather set to ${type} in ${selectedWorld}`);
    } catch (err: any) {
      alert(`Failed to set weather: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleTime = async (time: string) => {
    try {
      await client.post(`/server/time/${selectedWorld}/${time}`);
      alert(`Time set to ${time} in ${selectedWorld}`);
    } catch (err: any) {
      alert(`Failed to set time: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Server Control</h1>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">Manage server operations and world settings</p>
      </motion.div>

      {/* Server Operations */}
      <Card gradient>
        <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <Server className="w-6 h-6 text-blue-500" />
          </div>
          Server Operations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PermissionTooltip permission={Permission.SAVE_SERVER}>
            <motion.button
              onClick={handleSaveAll}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-medium"
            >
              <Save className="w-5 h-5" />
              Save All Worlds
            </motion.button>
          </PermissionTooltip>

          <PermissionTooltip permission={Permission.STOP_SERVER}>
            <motion.button
              onClick={handleStop}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all shadow-medium"
            >
              <Power className="w-5 h-5" />
              Stop Server
            </motion.button>
          </PermissionTooltip>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="number"
                value={restartDelay}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRestartDelay(parseInt(e.target.value))}
                min={10}
                className="w-24 px-3 py-2 bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary rounded-xl border border-light-border dark:border-dark-border focus:border-primary-500 focus:outline-none transition-colors"
              />
              <span className="self-center text-light-text-secondary dark:text-dark-text-secondary text-sm">seconds</span>
            </div>
            <PermissionTooltip permission={Permission.RESTART_SERVER}>
              <motion.button
                onClick={handleRestart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all shadow-medium"
              >
                <Power className="w-5 h-5" />
                Schedule Restart
              </motion.button>
            </PermissionTooltip>
          </div>
        </div>
      </Card>

      {/* World Selection */}
      {worlds.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">Select World</h2>
          <select
            value={selectedWorld}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedWorld(e.target.value)}
            className="w-full px-4 py-2 bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary rounded-xl border border-light-border dark:border-dark-border focus:border-primary-500 focus:outline-none transition-colors"
          >
            {worlds.map(world => (
              <option key={world.name} value={world.name}>
                {world.name} ({world.environment})
              </option>
            ))}
          </select>
        </Card>
      )}

      {/* Weather Control */}
      <div className="bg-light-card dark:bg-dark-surface p-6 rounded-lg border border-light-border dark:border-dark-border">
        <h2 className="text-xl font-bold text-light-text-primary dark:text-white mb-4 flex items-center gap-2">
          <CloudRain className="w-6 h-6" />
          Weather Control
        </h2>
        <div className="flex gap-2">
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleWeather('clear')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Sun className="w-5 h-5" />
              Clear
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleWeather('rain')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CloudRain className="w-5 h-5" />
              Rain
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleWeather('thunder')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ⚡ Thunder
            </button>
          </PermissionTooltip>
        </div>
      </div>

      {/* Time Control */}
      <div className="bg-light-card dark:bg-dark-surface p-6 rounded-lg border border-light-border dark:border-dark-border">
        <h2 className="text-xl font-bold text-light-text-primary dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Time Control
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleTime('day')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Sun className="w-5 h-5" />
              Day
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleTime('noon')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Sun className="w-5 h-5" />
              Noon
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleTime('night')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Moon className="w-5 h-5" />
              Night
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleTime('midnight')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Moon className="w-5 h-5" />
              Midnight
            </button>
          </PermissionTooltip>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-900/20 border border-yellow-500/50 p-4 rounded-lg">
        <p className="text-yellow-200 text-sm">
          <strong>⚠️ Warning:</strong> Server restart and stop operations will affect all players.
          Make sure to announce these actions beforehand!
        </p>
      </div>
    </div>
  );
}
