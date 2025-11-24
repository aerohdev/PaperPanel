import { useEffect, useState, ChangeEvent } from 'react';
import client from '../api/client';
import { Package, Power, PowerOff, RefreshCw, Search } from 'lucide-react';
import type { PluginInfo } from '../types/api';
import { PermissionTooltip } from '../components/PermissionTooltip';
import { Permission } from '../constants/permissions';
import { Card } from '../components/Card';
import { motion } from 'framer-motion';

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
        <Card className="text-light-text-primary dark:text-dark-text-primary text-xl">Loading plugins...</Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="text-red-500 text-xl">{error}</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Plugin Management</h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Manage server plugins ({plugins.length} total)</p>
        </div>
        <motion.button
          onClick={fetchPlugins}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-purple text-white rounded-xl hover:from-primary-600 hover:to-accent-purple/90 transition-all flex items-center gap-2 shadow-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </motion.button>
      </motion.div>

      {/* Search Bar */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
          <input
            type="text"
            placeholder="Search plugins..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary rounded-xl border border-light-border dark:border-dark-border focus:border-primary-500 focus:outline-none transition-colors"
          />
        </div>
      </Card>

      {/* Plugins Grid */}
      <div className="grid gap-4">
        {filteredPlugins.length === 0 ? (
          <Card className="text-center text-light-text-muted dark:text-dark-text-muted py-8">
            {searchTerm ? `No plugins found matching "${searchTerm}"` : 'No plugins found'}
          </Card>
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
    <div className="bg-light-card dark:bg-dark-surface p-6 rounded-lg border border-light-border dark:border-dark-border hover:border-light-border dark:hover:border-dark-hover transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-bold text-light-text-primary dark:text-white">{plugin.name}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              plugin.enabled
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-500'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-400 border-gray-400 dark:border-gray-600'
            }`}>
              {plugin.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="space-y-1 mb-4">
            <p className="text-light-text-muted dark:text-gray-400 text-sm">
              <span className="font-medium">Version:</span> {plugin.version}
            </p>
            {plugin.authors && plugin.authors.length > 0 && (
              <p className="text-light-text-muted dark:text-gray-400 text-sm">
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
      <div className="flex gap-2 mt-4 pt-4 border-t border-light-border dark:border-dark-border">
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
