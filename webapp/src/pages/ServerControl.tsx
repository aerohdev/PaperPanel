import { useState, useEffect, ChangeEvent } from 'react';
import client from '../api/client';
import { Server, Power, Save, CloudRain, Sun, Moon, Clock, PowerOff } from 'lucide-react';
import type { WorldInfo } from '../types/api';
import { PermissionTooltip } from '../components/PermissionTooltip';
import { Permission } from '../constants/permissions';
import { Card } from '../components/Card';
import { useToast } from '../contexts/ToastContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  variant: 'danger' | 'warning' | 'info';
}

export default function ServerControl() {
  const { toast } = useToast();
  const [restartDelay, setRestartDelay] = useState<number>(300);
  const [worlds, setWorlds] = useState<WorldInfo[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<string>('world');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'warning'
  });

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

  const showConfirm = (title: string, message: string, onConfirm: () => void, variant: 'danger' | 'warning' | 'info' = 'warning') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      variant
    });
  };

  const handleRestart = () => {
    showConfirm(
      'Schedule Server Restart',
      `Schedule server restart in ${restartDelay} seconds? Players will see countdown warnings.`,
      async () => {
        try {
          await client.post(`/server/restart?delay=${restartDelay}`);
          toast.info(`Server restart scheduled in ${restartDelay} seconds. Players will see countdown warnings.`);
        } catch (err: any) {
          toast.error(`Failed to schedule restart: ${err.response?.data?.message || err.message}`);
        }
      },
      'warning'
    );
  };

  const handleStop = () => {
    showConfirm(
      'Stop Server',
      'Stop the server immediately? This will disconnect all players and the server will restart!',
      async () => {
        try {
          await client.post('/server/stop');
          toast.warning('Server is stopping...');
        } catch (err: any) {
          toast.error(`Failed to stop server: ${err.response?.data?.message || err.message}`);
        }
      },
      'warning'
    );
  };

  const handleGracefulStop = () => {
    showConfirm(
      'Graceful Stop',
      'Stop the server without restarting? This will disconnect all players and shut down the server permanently until manually restarted!',
      async () => {
        try {
          await client.post('/server/graceful-stop');
          toast.warning('Server is stopping gracefully (will not restart)...');
        } catch (err: any) {
          toast.error(`Failed to stop server gracefully: ${err.response?.data?.message || err.message}`);
        }
      },
      'danger'
    );
  };

  const handleSaveAll = async () => {
    try {
      await client.post('/server/save-all');
      toast.success('All worlds saved successfully!');
    } catch (err: any) {
      toast.error(`Failed to save worlds: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleWeather = async (type: string) => {
    try {
      await client.post(`/server/weather/${selectedWorld}/${type}`);
      toast.success(`Weather set to ${type} in ${selectedWorld}`);
    } catch (err: any) {
      toast.error(`Failed to set weather: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleTime = async (time: string) => {
    try {
      await client.post(`/server/time/${selectedWorld}/${time}`);
      toast.success(`Time set to ${time} in ${selectedWorld}`);
    } catch (err: any) {
      toast.error(`Failed to set time: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        variant={confirmDialog.variant}
      />

      <div>
        <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Server Control</h1>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">Manage server operations and world settings</p>
      </div>

      {/* Server Operations */}
      <Card>
        <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-purple/20">
            <Server className="w-6 h-6 text-primary-500" />
          </div>
          Server Operations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PermissionTooltip permission={Permission.SAVE_SERVER}>
            <button
              onClick={handleSaveAll}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
            >
              <Save className="w-5 h-5" />
              Save All Worlds
            </button>
          </PermissionTooltip>

          <PermissionTooltip permission={Permission.STOP_SERVER}>
            <button
              onClick={handleStop}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
            >
              <Power className="w-5 h-5" />
              Stop & Restart
            </button>
          </PermissionTooltip>

          <PermissionTooltip permission={Permission.STOP_SERVER}>
            <button
              onClick={handleGracefulStop}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
            >
              <PowerOff className="w-5 h-5" />
              Graceful Stop
            </button>
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
              <button
                onClick={handleRestart}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
              >
                <Power className="w-5 h-5" />
                Schedule Restart
              </button>
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
      <Card>
        <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
          <CloudRain className="w-6 h-6" />
          Weather Control
        </h2>
        <div className="flex flex-wrap gap-2">
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleWeather('clear')}
              className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
            >
              <Sun className="w-5 h-5" />
              Clear
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleWeather('rain')}
              className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
            >
              <CloudRain className="w-5 h-5" />
              Rain
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleWeather('thunder')}
              className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
            >
              ⚡ Thunder
            </button>
          </PermissionTooltip>
        </div>
      </Card>

      {/* Time Control */}
      <Card>
        <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Time Control
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleTime('day')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
            >
              <Sun className="w-5 h-5" />
              Day
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleTime('noon')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
            >
              <Sun className="w-5 h-5" />
              Noon
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleTime('night')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
            >
              <Moon className="w-5 h-5" />
              Night
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleTime('midnight')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
            >
              <Moon className="w-5 h-5" />
              Midnight
            </button>
          </PermissionTooltip>
        </div>
      </Card>

      {/* Warning */}
      <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-500 p-4 rounded-lg">
        <p className="text-yellow-900 dark:text-yellow-200 text-sm mb-2">
          <strong>⚠️ Warning:</strong> Server restart and stop operations will affect all players.
          Make sure to announce these actions beforehand!
        </p>
        <p className="text-yellow-900 dark:text-yellow-200 text-xs">
          <strong>Note:</strong> "Stop & Restart" will restart automatically. "Graceful Stop" shuts down without restarting.
        </p>
      </div>
    </div>
  );
}
