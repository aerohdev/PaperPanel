import { useState, useEffect, ChangeEvent } from 'react';
import client from '../api/client';
import { Server, Power, Save, CloudRain, Sun, Moon, Clock } from 'lucide-react';
import type { WorldInfo } from '../types/api';

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
      setWorlds(data || []);
      if (data && data.length > 0) {
        setSelectedWorld(data[0].name);
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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Server Control</h1>
        <p className="text-gray-400">Manage server operations and world settings</p>
      </div>

      {/* Server Operations */}
      <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Server className="w-6 h-6" />
          Server Operations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleSaveAll}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-5 h-5" />
            Save All Worlds
          </button>

          <button
            onClick={handleStop}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Power className="w-5 h-5" />
            Stop Server
          </button>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="number"
                value={restartDelay}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRestartDelay(parseInt(e.target.value))}
                min={10}
                className="w-24 px-3 py-2 bg-dark-bg text-white rounded-lg border border-dark-border"
              />
              <span className="self-center text-gray-400 text-sm">seconds</span>
            </div>
            <button
              onClick={handleRestart}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Power className="w-5 h-5" />
              Schedule Restart
            </button>
          </div>
        </div>
      </div>

      {/* World Selection */}
      {worlds.length > 0 && (
        <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
          <h2 className="text-xl font-bold text-white mb-4">Select World</h2>
          <select
            value={selectedWorld}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedWorld(e.target.value)}
            className="w-full px-4 py-2 bg-dark-bg text-white rounded-lg border border-dark-border focus:border-blue-500 focus:outline-none"
          >
            {worlds.map(world => (
              <option key={world.name} value={world.name}>
                {world.name} ({world.environment})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Weather Control */}
      <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <CloudRain className="w-6 h-6" />
          Weather Control
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleWeather('clear')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Sun className="w-5 h-5" />
            Clear
          </button>
          <button
            onClick={() => handleWeather('rain')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <CloudRain className="w-5 h-5" />
            Rain
          </button>
          <button
            onClick={() => handleWeather('thunder')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ⚡ Thunder
          </button>
        </div>
      </div>

      {/* Time Control */}
      <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Time Control
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => handleTime('day')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Sun className="w-5 h-5" />
            Day
          </button>
          <button
            onClick={() => handleTime('noon')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Sun className="w-5 h-5" />
            Noon
          </button>
          <button
            onClick={() => handleTime('night')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Moon className="w-5 h-5" />
            Night
          </button>
          <button
            onClick={() => handleTime('midnight')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Moon className="w-5 h-5" />
            Midnight
          </button>
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
