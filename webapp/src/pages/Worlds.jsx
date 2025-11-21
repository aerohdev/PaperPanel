import { useEffect, useState } from 'react';
import client from '../api/client';
import { Globe, Users, Boxes, Skull, RefreshCw, Settings, Sun, Moon, Cloud, CloudRain, Zap, Swords, X, Check, AlertCircle } from 'lucide-react';

export default function Worlds() {
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorld, setSelectedWorld] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchWorlds();
  }, []);

  const fetchWorlds = async () => {
    try {
      const { data } = await client.get('/worlds');
      // Response is already unwrapped by interceptor
      setWorlds(data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load worlds');
      console.error('Error fetching worlds:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const updateWorldSettings = async (worldName, settings) => {
    try {
      await client.post(`/worlds/${worldName}/settings`, settings);
      showToast('Settings updated successfully');
      setTimeout(fetchWorlds, 1000);
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update settings', 'error');
      return false;
    }
  };

  const updateAllWorldSettings = async (settings) => {
    try {
      const response = await client.post('/worlds/bulk/settings', settings);
      showToast(`Updated ${response.data.worldsUpdated || 0} world(s) successfully`);
      setTimeout(fetchWorlds, 1000);
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update settings', 'error');
      return false;
    }
  };

  const quickAction = async (worldName, action) => {
    const actions = {
      day: { time: 1000 },
      noon: { time: 6000 },
      night: { time: 13000 },
      midnight: { time: 18000 },
      clearWeather: { weather: 'clear' },
      togglePvp: (world) => ({ pvp: !world.pvp })
    };

    const world = worlds.find(w => w.name === worldName);
    const settings = typeof actions[action] === 'function' 
      ? actions[action](world) 
      : actions[action];

    await updateWorldSettings(worldName, settings);
  };

  const formatTime = (time) => {
    const hours = Math.floor(time / 1000) + 6;
    const displayHours = hours % 24;
    return `${displayHours.toString().padStart(2, '0')}:00`;
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
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">World Management</h1>
          <p className="text-gray-400">{worlds.length} world(s) loaded</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Bulk Settings
          </button>
          <button
            onClick={fetchWorlds}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* World Cards */}
      <div className="grid gap-4">
        {worlds.map(world => (
          <WorldCard
            key={world.name}
            world={world}
            formatTime={formatTime}
            onExpand={() => setSelectedWorld(selectedWorld?.name === world.name ? null : world)}
            isExpanded={selectedWorld?.name === world.name}
            onQuickAction={quickAction}
            onOpenSettings={() => {
              setSelectedWorld(world);
              setShowSettingsModal(true);
            }}
          />
        ))}
      </div>

      {worlds.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No worlds found
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedWorld && (
        <WorldSettingsModal
          world={selectedWorld}
          onClose={() => {
            setShowSettingsModal(false);
            setSelectedWorld(null);
          }}
          onSave={updateWorldSettings}
        />
      )}

      {/* Bulk Settings Modal */}
      {showBulkModal && (
        <BulkSettingsModal
          onClose={() => setShowBulkModal(false)}
          onSave={updateAllWorldSettings}
          worldCount={worlds.length}
        />
      )}
    </div>
  );
}

// Toast Component
function Toast({ message, type, onClose }) {
  const colors = {
    success: 'bg-green-500/10 border-green-500 text-green-500',
    error: 'bg-red-500/10 border-red-500 text-red-500',
    info: 'bg-blue-500/10 border-blue-500 text-blue-500'
  };

  const icons = {
    success: Check,
    error: AlertCircle,
    info: AlertCircle
  };

  const Icon = icons[type];

  return (
    <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg border ${colors[type]} flex items-center gap-3 shadow-lg animate-slide-in`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// World Card Component
function WorldCard({ world, formatTime, onExpand, isExpanded, onQuickAction, onOpenSettings }) {
  const [actionLoading, setActionLoading] = useState(null);

  const handleQuickAction = async (action) => {
    setActionLoading(action);
    await onQuickAction(world.name, action);
    setActionLoading(null);
  };

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

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <QuickActionButton
                icon={Sun}
                label="Day"
                onClick={() => handleQuickAction('day')}
                loading={actionLoading === 'day'}
              />
              <QuickActionButton
                icon={Moon}
                label="Night"
                onClick={() => handleQuickAction('night')}
                loading={actionLoading === 'night'}
              />
              <QuickActionButton
                icon={Cloud}
                label="Clear"
                onClick={() => handleQuickAction('clearWeather')}
                loading={actionLoading === 'clearWeather'}
              />
              <QuickActionButton
                icon={Swords}
                label={world.pvp ? 'PVP: ON' : 'PVP: OFF'}
                onClick={() => handleQuickAction('togglePvp')}
                loading={actionLoading === 'togglePvp'}
                variant={world.pvp ? 'danger' : 'success'}
              />
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors text-sm"
              >
                <Settings className="w-4 h-4" />
                Advanced
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={onExpand}
          className="text-gray-400 hover:text-white transition-colors"
        >
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {Object.entries(world.gameRules).map(([rule, value]) => (
                  <div key={rule} className="bg-dark-bg p-2 rounded">
                    <p className="text-gray-400 text-xs">{rule}</p>
                    <p className={`text-sm font-medium ${value ? 'text-green-400' : 'text-red-400'}`}>
                      {String(value)}
                    </p>
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

// Quick Action Button Component
function QuickActionButton({ icon: Icon, label, onClick, loading, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-600/20 hover:bg-gray-600/30 text-gray-300',
    success: 'bg-green-600/20 hover:bg-green-600/30 text-green-400',
    danger: 'bg-red-600/20 hover:bg-red-600/30 text-red-400'
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${variants[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <Icon className="w-4 h-4" />
      {loading ? 'Loading...' : label}
    </button>
  );
}

// World Settings Modal Component
function WorldSettingsModal({ world, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('quick');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    time: world.time,
    weather: world.thundering ? 'thunder' : world.storm ? 'rain' : 'clear',
    difficulty: world.difficulty,
    pvp: world.pvp,
    spawnLocation: { ...world.spawnLocation },
    keepSpawnInMemory: world.keepSpawnInMemory,
    gameRules: { ...world.gameRules }
  });

  const handleSave = async () => {
    setLoading(true);
    const success = await onSave(world.name, settings);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal title={`World Settings - ${world.name}`} onClose={onClose} size="large">
      {/* Tabs */}
      <div className="flex border-b border-dark-border mb-6">
        <TabButton label="Quick Actions" active={activeTab === 'quick'} onClick={() => setActiveTab('quick')} />
        <TabButton label="Advanced" active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} />
        <TabButton label="Game Rules" active={activeTab === 'gamerules'} onClick={() => setActiveTab('gamerules')} />
      </div>

      {/* Tab Content */}
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {activeTab === 'quick' && (
          <QuickActionsTab settings={settings} setSettings={setSettings} />
        )}
        {activeTab === 'advanced' && (
          <AdvancedTab settings={settings} setSettings={setSettings} />
        )}
        {activeTab === 'gamerules' && (
          <GameRulesTab settings={settings} setSettings={setSettings} />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-6 border-t border-dark-border">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-dark-hover hover:bg-dark-border text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

// Quick Actions Tab
function QuickActionsTab({ settings, setSettings }) {
  const timePresets = [
    { label: 'Dawn', value: 0, icon: '🌅' },
    { label: 'Day', value: 1000, icon: '☀️' },
    { label: 'Noon', value: 6000, icon: '🌞' },
    { label: 'Sunset', value: 12000, icon: '🌇' },
    { label: 'Night', value: 13000, icon: '🌙' },
    { label: 'Midnight', value: 18000, icon: '🌃' }
  ];

  return (
    <div className="space-y-6">
      {/* Time Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Time Presets</label>
        <div className="grid grid-cols-3 gap-3">
          {timePresets.map(preset => (
            <button
              key={preset.value}
              onClick={() => setSettings({ ...settings, time: preset.value })}
              className={`p-3 rounded-lg border transition-colors ${
                settings.time === preset.value
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-dark-border bg-dark-hover text-gray-300 hover:border-dark-hover'
              }`}
            >
              <div className="text-2xl mb-1">{preset.icon}</div>
              <div className="text-sm font-medium">{preset.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Custom Time: {settings.time} ({Math.floor(((settings.time / 1000) + 6) % 24)}:00)
        </label>
        <input
          type="range"
          min="0"
          max="24000"
          step="100"
          value={settings.time}
          onChange={(e) => setSettings({ ...settings, time: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Weather */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Weather</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'clear', label: 'Clear', icon: Cloud },
            { value: 'rain', label: 'Rain', icon: CloudRain },
            { value: 'thunder', label: 'Thunder', icon: Zap }
          ].map(weather => (
            <button
              key={weather.value}
              onClick={() => setSettings({ ...settings, weather: weather.value })}
              className={`p-3 rounded-lg border transition-colors ${
                settings.weather === weather.value
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-dark-border bg-dark-hover text-gray-300 hover:border-dark-hover'
              }`}
            >
              <weather.icon className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm font-medium">{weather.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* PVP Toggle */}
      <div className="flex items-center justify-between p-4 bg-dark-hover rounded-lg">
        <div>
          <p className="text-white font-medium">PVP</p>
          <p className="text-gray-400 text-sm">Allow player vs player combat</p>
        </div>
        <ToggleSwitch
          checked={settings.pvp}
          onChange={(checked) => setSettings({ ...settings, pvp: checked })}
        />
      </div>
    </div>
  );
}

// Advanced Tab
function AdvancedTab({ settings, setSettings }) {
  return (
    <div className="space-y-6">
      {/* Difficulty */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
        <select
          value={settings.difficulty}
          onChange={(e) => setSettings({ ...settings, difficulty: e.target.value })}
          className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="PEACEFUL">Peaceful</option>
          <option value="EASY">Easy</option>
          <option value="NORMAL">Normal</option>
          <option value="HARD">Hard</option>
        </select>
      </div>

      {/* Spawn Location */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Spawn Location</label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">X</label>
            <input
              type="number"
              value={settings.spawnLocation.x}
              onChange={(e) => setSettings({
                ...settings,
                spawnLocation: { ...settings.spawnLocation, x: parseInt(e.target.value) || 0 }
              })}
              className="w-full px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Y</label>
            <input
              type="number"
              value={settings.spawnLocation.y}
              onChange={(e) => setSettings({
                ...settings,
                spawnLocation: { ...settings.spawnLocation, y: parseInt(e.target.value) || 0 }
              })}
              className="w-full px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Z</label>
            <input
              type="number"
              value={settings.spawnLocation.z}
              onChange={(e) => setSettings({
                ...settings,
                spawnLocation: { ...settings.spawnLocation, z: parseInt(e.target.value) || 0 }
              })}
              className="w-full px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Keep Spawn in Memory */}
      <div className="flex items-center justify-between p-4 bg-dark-hover rounded-lg">
        <div>
          <p className="text-white font-medium">Keep Spawn in Memory</p>
          <p className="text-gray-400 text-sm">Keep spawn chunks loaded</p>
        </div>
        <ToggleSwitch
          checked={settings.keepSpawnInMemory}
          onChange={(checked) => setSettings({ ...settings, keepSpawnInMemory: checked })}
        />
      </div>
    </div>
  );
}

// Game Rules Tab
function GameRulesTab({ settings, setSettings }) {
  const topGameRules = [
    { key: 'doDaylightCycle', label: 'Daylight Cycle', description: 'Advance time of day' },
    { key: 'doWeatherCycle', label: 'Weather Cycle', description: 'Change weather conditions' },
    { key: 'keepInventory', label: 'Keep Inventory', description: 'Keep items on death' },
    { key: 'mobGriefing', label: 'Mob Griefing', description: 'Mobs can destroy blocks' },
    { key: 'doMobSpawning', label: 'Mob Spawning', description: 'Mobs can spawn naturally' },
    { key: 'naturalRegeneration', label: 'Natural Regeneration', description: 'Players regenerate health' },
    { key: 'showDeathMessages', label: 'Death Messages', description: 'Show death messages in chat' },
    { key: 'announceAdvancements', label: 'Announce Advancements', description: 'Show advancement messages' },
    { key: 'doFireTick', label: 'Fire Spread', description: 'Fire can spread' },
    { key: 'doImmediateRespawn', label: 'Immediate Respawn', description: 'Skip respawn screen' }
  ];

  const toggleGameRule = (key) => {
    setSettings({
      ...settings,
      gameRules: {
        ...settings.gameRules,
        [key]: !settings.gameRules[key]
      }
    });
  };

  return (
    <div className="space-y-3">
      {topGameRules.map(rule => (
        <div key={rule.key} className="flex items-center justify-between p-4 bg-dark-hover rounded-lg">
          <div>
            <p className="text-white font-medium">{rule.label}</p>
            <p className="text-gray-400 text-sm">{rule.description}</p>
          </div>
          <ToggleSwitch
            checked={settings.gameRules[rule.key] || false}
            onChange={() => toggleGameRule(rule.key)}
          />
        </div>
      ))}
    </div>
  );
}

// Bulk Settings Modal
function BulkSettingsModal({ onClose, onSave, worldCount }) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    difficulty: '',
    pvp: null,
    weather: '',
    time: ''
  });

  const handleSave = async () => {
    // Only send non-empty settings
    const cleanSettings = {};
    if (settings.difficulty) cleanSettings.difficulty = settings.difficulty;
    if (settings.pvp !== null) cleanSettings.pvp = settings.pvp;
    if (settings.weather) cleanSettings.weather = settings.weather;
    if (settings.time !== '') cleanSettings.time = parseInt(settings.time);

    if (Object.keys(cleanSettings).length === 0) {
      alert('Please select at least one setting to update');
      return;
    }

    setLoading(true);
    const success = await onSave(cleanSettings);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal title={`Bulk Settings - Apply to ${worldCount} World(s)`} onClose={onClose}>
      <div className="space-y-4">
        <div className="p-3 bg-yellow-500/10 border border-yellow-500 rounded-lg">
          <p className="text-yellow-500 text-sm">
            ⚠️ These settings will be applied to ALL worlds. Leave blank to skip.
          </p>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
          <select
            value={settings.difficulty}
            onChange={(e) => setSettings({ ...settings, difficulty: e.target.value })}
            className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Don't change</option>
            <option value="PEACEFUL">Peaceful</option>
            <option value="EASY">Easy</option>
            <option value="NORMAL">Normal</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        {/* PVP */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">PVP</label>
          <select
            value={settings.pvp === null ? '' : settings.pvp.toString()}
            onChange={(e) => setSettings({ 
              ...settings, 
              pvp: e.target.value === '' ? null : e.target.value === 'true' 
            })}
            className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Don't change</option>
            <option value="true">Enable</option>
            <option value="false">Disable</option>
          </select>
        </div>

        {/* Weather */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Weather</label>
          <select
            value={settings.weather}
            onChange={(e) => setSettings({ ...settings, weather: e.target.value })}
            className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Don't change</option>
            <option value="clear">Clear</option>
            <option value="rain">Rain</option>
            <option value="thunder">Thunder</option>
          </select>
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
          <select
            value={settings.time}
            onChange={(e) => setSettings({ ...settings, time: e.target.value })}
            className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Don't change</option>
            <option value="1000">Day</option>
            <option value="6000">Noon</option>
            <option value="13000">Night</option>
            <option value="18000">Midnight</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 border-t border-dark-border mt-6">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {loading ? 'Applying...' : `Apply to ${worldCount} World(s)`}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-dark-hover hover:bg-dark-border text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

// Reusable Components
function Modal({ title, children, onClose, size = 'default' }) {
  const sizes = {
    default: 'max-w-md',
    large: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-dark-surface border border-dark-border rounded-lg ${sizes[size]} w-full max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium transition-colors ${
        active
          ? 'text-blue-400 border-b-2 border-blue-400'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-600'
      }`}
    >
      <div
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? 'transform translate-x-6' : ''
        }`}
      />
    </button>
  );
}
