import { useEffect, useState, ChangeEvent } from 'react';
import client from '../api/client';
import { Package, Power, PowerOff, RefreshCw, Search } from 'lucide-react';
import type { PluginInfo } from '../types/api';
import { PermissionTooltip } from '../components/PermissionTooltip';
import { Permission } from '../constants/permissions';

export default function Plugins() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      const { data } = await client.get<PluginInfo[]>('/plugins');
      // Ensure data is an array
      const pluginsArray = Array.isArray(data) ? data : [];
      setPlugins(pluginsArray);
      setError(null);
    } catch (err: any) {
      setError('Failed to load plugins');
      console.error('Error fetching plugins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (name: string) => {
    setActionLoading(name);
    try {
      await client.post(`/plugins/${name}/enable`);
      await fetchPlugins();
    } catch (err: any) {
      alert(`Failed to enable plugin: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisable = async (name: string) => {
    setActionLoading(name);
    try {
      await client.post(`/plugins/${name}/disable`);
      await fetchPlugins();
    } catch (err: any) {
      alert(`Failed to disable plugin: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReload = async (name: string) => {
    setActionLoading(name);
    try {
      await client.post(`/plugins/${name}/reload`);
      alert(`Plugin "${name}" configuration reloaded successfully!`);
    } catch (err: any) {
      alert(`Failed to reload plugin: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPlugins = plugins.filter(plugin =>
    plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plugin.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading plugins...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Plugin Management</h1>
          <p className="text-gray-400">Manage server plugins ({plugins.length} total)</p>
        </div>
        <button
          onClick={fetchPlugins}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search plugins..."
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-dark-surface text-white rounded-lg border border-dark-border focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Plugins Grid */}
      <div className="grid gap-4">
        {filteredPlugins.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {searchTerm ? `No plugins found matching "${searchTerm}"` : 'No plugins found'}
          </div>
        ) : (
          filteredPlugins.map(plugin => (
            <PluginCard
              key={plugin.name}
              plugin={plugin}
              onEnable={handleEnable}
              onDisable={handleDisable}
              onReload={handleReload}
              loading={actionLoading === plugin.name}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface PluginCardProps {
  plugin: PluginInfo;
  onEnable: (name: string) => void;
  onDisable: (name: string) => void;
  onReload: (name: string) => void;
  loading: boolean;
}

function PluginCard({ plugin, onEnable, onDisable, onReload, loading }: PluginCardProps) {
  return (
    <div className="bg-dark-surface p-6 rounded-lg border border-dark-border hover:border-dark-hover transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-bold text-white">{plugin.name}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              plugin.enabled
                ? 'bg-green-900/30 text-green-400 border border-green-500'
                : 'bg-gray-700 text-gray-400 border border-gray-600'
            }`}>
              {plugin.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="space-y-1 mb-4">
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Version:</span> {plugin.version}
            </p>
            {plugin.authors && plugin.authors.length > 0 && (
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Author:</span> {plugin.authors.join(', ')}
              </p>
            )}
            {plugin.description && (
              <p className="text-gray-500 text-sm mt-2">{plugin.description}</p>
            )}
          </div>

          {/* Dependencies */}
          {(plugin.depends?.length > 0 || plugin.softDepends?.length > 0) && (
            <div className="mb-4">
              {plugin.depends?.length > 0 && (
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Depends:</span>{' '}
                  {plugin.depends.join(', ')}
                </div>
              )}
              {plugin.softDepends?.length > 0 && (
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Soft Depends:</span>{' '}
                  {plugin.softDepends.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-dark-border">
        {plugin.enabled ? (
          <>
            <PermissionTooltip permission={Permission.MANAGE_PLUGINS}>
              <button
                onClick={() => onDisable(plugin.name)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PowerOff className="w-4 h-4" />
                {loading ? 'Loading...' : 'Disable'}
              </button>
            </PermissionTooltip>
            <PermissionTooltip permission={Permission.MANAGE_PLUGINS}>
              <button
                onClick={() => onReload(plugin.name)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                {loading ? 'Loading...' : 'Reload Config'}
              </button>
            </PermissionTooltip>
          </>
        ) : (
          <PermissionTooltip permission={Permission.MANAGE_PLUGINS}>
            <button
              onClick={() => onEnable(plugin.name)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Power className="w-4 h-4" />
              {loading ? 'Loading...' : 'Enable'}
            </button>
          </PermissionTooltip>
        )}
      </div>
    </div>
  );
}
