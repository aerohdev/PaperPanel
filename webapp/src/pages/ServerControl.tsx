import { useState, useEffect, ChangeEvent } from 'react';
import client from '../api/client';
import { Server, Power, Save, CloudRain, Sun, Moon, Clock, PowerOff, Shield, Users, X, Settings as SettingsIcon } from 'lucide-react';
import type { WorldInfo } from '../types/api';
import { PermissionTooltip } from '../components/PermissionTooltip';
import { Permission } from '../constants/permissions';
import { Card } from '../components/Card';
import { useToast } from '../contexts/ToastContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ScrollAnimatedItem } from '../components/ScrollAnimatedItem';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  variant: 'danger' | 'warning' | 'info';
}

interface MaintenanceWhitelistPlayer {
  uuid: string;
  name: string;
}

interface MaintenanceStatus {
  enabled: boolean;
  kickMessage: string;
  motd: string;
  playerCountText: string;
  serverIconPath: string;
  endTime: number;
  whitelist: MaintenanceWhitelistPlayer[];
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

  // Maintenance mode state
  const [maintenance, setMaintenance] = useState<MaintenanceStatus | null>(null);
  const [maintenanceSettings, setMaintenanceSettings] = useState({
    kickMessage: '',
    motd: '',
    playerCountText: '',
    serverIconPath: ''
  });
  const [maintenanceTimer, setMaintenanceTimer] = useState<number>(0);
  const [newWhitelistPlayer, setNewWhitelistPlayer] = useState('');
  const [showMaintenanceSettings, setShowMaintenanceSettings] = useState(false);

  useEffect(() => {
    fetchWorlds();
    fetchMaintenanceStatus();
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

  // Maintenance mode functions
  const fetchMaintenanceStatus = async () => {
    try {
      const { data } = await client.get('/maintenance/status');
      setMaintenance(data);
      setMaintenanceSettings({
        kickMessage: data.kickMessage,
        motd: data.motd,
        playerCountText: data.playerCountText || '',
        serverIconPath: data.serverIconPath || ''
      });
    } catch (err: any) {
      console.error('Failed to fetch maintenance status:', err);
    }
  };

  const toggleMaintenance = async () => {
    if (!maintenance) return;

    try {
      if (maintenance.enabled) {
        await client.post('/maintenance/disable');
        toast.success('Maintenance mode disabled!');
      } else {
        await client.post('/maintenance/enable');
        toast.success('Maintenance mode enabled!');
      }
      await fetchMaintenanceStatus();
    } catch (err: any) {
      toast.error(`Failed to toggle maintenance mode: ${err.response?.data?.message || err.message}`);
    }
  };

  const saveMaintenanceSettings = async () => {
    try {
      await client.put('/maintenance/settings', maintenanceSettings);
      toast.success('Maintenance settings saved!');
      await fetchMaintenanceStatus();
      setShowMaintenanceSettings(false);
    } catch (err: any) {
      toast.error(`Failed to save settings: ${err.response?.data?.message || err.message}`);
    }
  };

  const setMaintenanceTimerDuration = async () => {
    try {
      if (maintenanceTimer > 0) {
        await client.post('/maintenance/timer', { duration: maintenanceTimer });
        toast.success(`Maintenance timer set to ${maintenanceTimer} minutes`);
      } else {
        await client.post('/maintenance/timer', {});
        toast.success('Maintenance timer cleared');
      }
      await fetchMaintenanceStatus();
      setMaintenanceTimer(0);
    } catch (err: any) {
      toast.error(`Failed to set timer: ${err.response?.data?.message || err.message}`);
    }
  };

  const addToMaintenanceWhitelist = async () => {
    if (!newWhitelistPlayer.trim()) return;

    try {
      await client.post('/maintenance/whitelist/add', { playerName: newWhitelistPlayer.trim() });
      toast.success(`Added ${newWhitelistPlayer} to maintenance whitelist`);
      setNewWhitelistPlayer('');
      await fetchMaintenanceStatus();
    } catch (err: any) {
      toast.error(`Failed to add player: ${err.response?.data?.message || err.message}`);
    }
  };

  const removeFromMaintenanceWhitelist = async (uuid: string, name: string) => {
    try {
      await client.delete(`/maintenance/whitelist/remove/${uuid}`);
      toast.success(`Removed ${name} from maintenance whitelist`);
      await fetchMaintenanceStatus();
    } catch (err: any) {
      toast.error(`Failed to remove player: ${err.response?.data?.message || err.message}`);
    }
  };

  const formatTimeRemaining = (endTime: number) => {
    if (endTime === 0) return null;
    const now = Date.now();
    if (endTime <= now) return 'Ending soon...';

    const diff = endTime - now;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h ${minutes % 60}m remaining`;
    if (minutes > 0) return `${minutes}m remaining`;
    return 'Less than 1m remaining';
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
        <h1 className="text-3xl font-bold text-white mb-2">Server Control</h1>
        <p className="text-gray-300">Manage server operations and world settings</p>
      </div>

      {/* Server Operations */}
      <ScrollAnimatedItem delay={0}>
      <Card>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-purple/20">
            <Server className="w-6 h-6 text-primary-500" />
          </div>
          Server Operations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PermissionTooltip permission={Permission.SAVE_SERVER}>
            <button
              onClick={handleSaveAll}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-emerald-600/80 via-emerald-700/80 to-emerald-600/80 backdrop-blur-xl text-white rounded-xl hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-600 transition-colors font-medium border border-emerald-500/50 shadow-[0_4px_16px_0_rgba(16,185,129,0.3),0_0_30px_0_rgba(16,185,129,0.2)]"
            >
              <Save className="w-5 h-5" />
              Save All Worlds
            </button>
          </PermissionTooltip>

          <PermissionTooltip permission={Permission.STOP_SERVER}>
            <button
              onClick={handleStop}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-orange-600/80 via-orange-700/80 to-orange-600/80 backdrop-blur-xl text-white rounded-xl hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 transition-colors font-medium border border-orange-500/50 shadow-[0_4px_16px_0_rgba(249,115,22,0.3),0_0_30px_0_rgba(249,115,22,0.2)]"
            >
              <Power className="w-5 h-5" />
              Stop & Restart
            </button>
          </PermissionTooltip>

          <PermissionTooltip permission={Permission.STOP_SERVER}>
            <button
              onClick={handleGracefulStop}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-red-600/80 via-red-700/80 to-red-600/80 backdrop-blur-xl text-white rounded-xl hover:from-red-600 hover:via-red-700 hover:to-red-600 transition-colors font-medium border border-red-500/50 shadow-[0_4px_16px_0_rgba(239,68,68,0.3),0_0_30px_0_rgba(239,68,68,0.2)]"
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
                className="w-24 px-3 py-2 bg-gray-900/40 backdrop-blur-xl text-white placeholder-gray-500 rounded-xl border border-white/20 focus:border-primary-500 focus:outline-none transition-colors"
              />
              <span className="self-center text-gray-300 text-sm">seconds</span>
            </div>
            <PermissionTooltip permission={Permission.RESTART_SERVER}>
              <button
                onClick={handleRestart}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
              >
                <Power className="w-5 h-5" />
                Schedule Restart
              </button>
            </PermissionTooltip>
          </div>
        </div>
      </Card>
      </ScrollAnimatedItem>

      {/* Maintenance Mode */}
      {maintenance && (
        <ScrollAnimatedItem delay={0.1}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
                <Shield className="w-6 h-6 text-orange-500" />
              </div>
              Maintenance Mode
            </h2>
            <PermissionTooltip permission={Permission.RESTART_SERVER}>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-sm font-medium text-gray-300">
                  {maintenance.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={maintenance.enabled}
                    onChange={toggleMaintenance}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-300 bg-gray-900/40 backdrop-blur-xl peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                </div>
              </label>
            </PermissionTooltip>
          </div>

          {maintenance.enabled && (
            <div className="mb-4 p-3 bg-orange-900/20 border border-orange-500 rounded-lg">
              <p className="text-orange-200 text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Maintenance mode is active - only whitelisted players can join
              </p>
              {maintenance.endTime > 0 && (
                <p className="text-orange-200 text-xs mt-1">
                  {formatTimeRemaining(maintenance.endTime)}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Settings Panel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-400">SETTINGS</h3>
                <button
                  onClick={() => setShowMaintenanceSettings(!showMaintenanceSettings)}
                  className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <SettingsIcon className="w-3 h-3" />
                  {showMaintenanceSettings ? 'Hide' : 'Edit Messages'}
                </button>
              </div>

              {showMaintenanceSettings && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Kick Message
                    </label>
                    <textarea
                      value={maintenanceSettings.kickMessage}
                      onChange={(e) => setMaintenanceSettings({...maintenanceSettings, kickMessage: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-900/40 backdrop-blur-xl text-white placeholder-gray-500 rounded-xl border border-white/20 focus:border-primary-500 focus:outline-none text-sm"
                      placeholder="Message shown to players trying to join"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      MOTD (Server List Message)
                    </label>
                    <textarea
                      value={maintenanceSettings.motd}
                      onChange={(e) => setMaintenanceSettings({...maintenanceSettings, motd: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-900/40 backdrop-blur-xl text-white placeholder-gray-500 rounded-xl border border-white/20 focus:border-primary-500 focus:outline-none text-sm"
                      placeholder="Message shown in server list. Use %TIMER% for countdown."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Player Count Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={maintenanceSettings.playerCountText}
                      onChange={(e) => setMaintenanceSettings({...maintenanceSettings, playerCountText: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900/40 backdrop-blur-xl text-white placeholder-gray-500 rounded-xl border border-white/20 focus:border-primary-500 focus:outline-none text-sm"
                      placeholder="Leave empty for normal count"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Custom text shown in place of player count (e.g., "Maintenance in progress")
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Server Icon Path (Optional)
                    </label>
                    <input
                      type="text"
                      value={maintenanceSettings.serverIconPath}
                      onChange={(e) => setMaintenanceSettings({...maintenanceSettings, serverIconPath: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900/40 backdrop-blur-xl text-white placeholder-gray-500 rounded-xl border border-white/20 focus:border-primary-500 focus:outline-none text-sm"
                      placeholder="Leave empty for default icon"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Absolute path to custom PNG icon (64x64, e.g., /path/to/maintenance-icon.png)
                    </p>
                  </div>

                  <button
                    onClick={saveMaintenanceSettings}
                    className="w-full px-4 py-2 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors text-sm font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
                  >
                    Save Settings
                  </button>
                </div>
              )}

              {/* Timer */}
              <div className="pt-3 border-t border-white/20">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Auto-Disable Timer (minutes)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={maintenanceTimer}
                    onChange={(e) => setMaintenanceTimer(parseInt(e.target.value) || 0)}
                    min={0}
                    className="flex-1 px-3 py-2 bg-gray-900/40 backdrop-blur-xl text-white placeholder-gray-500 rounded-xl border border-white/20 focus:border-primary-500 focus:outline-none text-sm"
                    placeholder="0 = no timer"
                  />
                  <button
                    onClick={setMaintenanceTimerDuration}
                    className="px-4 py-2 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors text-sm font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
                  >
                    Set Timer
                  </button>
                </div>
              </div>
            </div>

            {/* Whitelist Panel */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                WHITELIST ({maintenance.whitelist.length})
              </h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWhitelistPlayer}
                  onChange={(e) => setNewWhitelistPlayer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addToMaintenanceWhitelist()}
                  placeholder="Player name"
                  className="flex-1 px-3 py-2 bg-gray-900/40 backdrop-blur-xl text-white placeholder-gray-500 rounded-xl border border-white/20 focus:border-primary-500 focus:outline-none text-sm"
                />
                <button
                  onClick={addToMaintenanceWhitelist}
                  className="px-4 py-2 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors text-sm font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
                >
                  Add
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {maintenance.whitelist.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No players whitelisted
                  </p>
                ) : (
                  maintenance.whitelist.map(player => (
                    <div
                      key={player.uuid}
                      className="flex items-center justify-between px-3 py-2 bg-gray-900/40 backdrop-blur-xl rounded-lg"
                    >
                      <span className="text-sm text-white">
                        {player.name}
                      </span>
                      <button
                        onClick={() => removeFromMaintenanceWhitelist(player.uuid, player.name)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <p className="text-xs text-gray-400\">
                Players with <code className="px-1 bg-gray-900/40 rounded">paperpanel.maintenance.bypass</code> permission can also join
              </p>
            </div>
          </div>
        </Card>
        </ScrollAnimatedItem>
      )}

      {/* World Selection */}
      {worlds.length > 0 && (
        <ScrollAnimatedItem delay={0.2}>
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">Select World</h2>
          <select
            value={selectedWorld}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedWorld(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900/40 backdrop-blur-xl text-white rounded-xl border border-white/20 focus:border-primary-500 focus:outline-none transition-colors [&>option]:bg-gray-900 [&>option]:text-white"
          >
            {worlds.map(world => (
              <option key={world.name} value={world.name}>
                {world.name} ({world.environment})
              </option>
            ))}
          </select>
        </Card>
        </ScrollAnimatedItem>
      )}

      {/* Weather Control */}
      <ScrollAnimatedItem delay={0.3}>
      <Card>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <CloudRain className="w-6 h-6" />
          Weather Control
        </h2>
        <div className="flex flex-wrap gap-2">
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleWeather('clear')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
            >
              <Sun className="w-5 h-5" />
              Clear
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleWeather('rain')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
            >
              <CloudRain className="w-5 h-5" />
              Rain
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleWeather('thunder')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
            >
              ⚡ Thunder
            </button>
          </PermissionTooltip>
        </div>
      </Card>
      </ScrollAnimatedItem>

      {/* Time Control */}
      <ScrollAnimatedItem delay={0.4}>
      <Card>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Time Control
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleTime('day')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
            >
              <Sun className="w-5 h-5" />
              Day
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleTime('noon')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
            >
              <Sun className="w-5 h-5" />
              Noon
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleTime('night')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
            >
              <Moon className="w-5 h-5" />
              Night
            </button>
          </PermissionTooltip>
          <PermissionTooltip permission={Permission.MANAGE_WORLDS}>
            <button
              onClick={() => handleTime('midnight')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
            >
              <Moon className="w-5 h-5" />
              Midnight
            </button>
          </PermissionTooltip>
        </div>
      </Card>
      </ScrollAnimatedItem>

      {/* Warning */}
      <div className="bg-yellow-900/20 border border-yellow-500 p-4 rounded-lg">
        <p className="text-yellow-200 text-sm mb-2">
          <strong>⚠️ Warning:</strong> Server restart and stop operations will affect all players.
          Make sure to announce these actions beforehand!
        </p>
        <p className="text-yellow-200 text-xs">
          <strong>Note:</strong> "Stop & Restart" will restart automatically. "Graceful Stop" shuts down without restarting.
        </p>
      </div>
    </div>
  );
}
