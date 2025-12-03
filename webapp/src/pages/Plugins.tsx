import { useEffect, useState, ChangeEvent } from 'react';
import client from '../api/client';
import { Package, Power, PowerOff, RefreshCw, Search } from 'lucide-react';
import type { PluginInfo } from '../types/api';
import { PermissionTooltip } from '../components/PermissionTooltip';
import { Permission } from '../constants/permissions';
import { Card } from '../components/Card';
import { useToast } from '../contexts/ToastContext';
import { ScrollAnimatedItem } from '../components/ScrollAnimatedItem';

export default function Plugins() {
  const { toast } = useToast();
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
      toast.success(`Plugin "${name}" enabled`);
      await fetchPlugins();
    } catch (err: any) {
      toast.error(`Failed to enable plugin: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisable = async (name: string) => {
    setActionLoading(name);
    try {
      await client.post(`/plugins/${name}/disable`);
      toast.success(`Plugin "${name}" disabled`);
      await fetchPlugins();
    } catch (err: any) {
      toast.error(`Failed to disable plugin: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReload = async (name: string) => {
    setActionLoading(name);
    try {
      await client.post(`/plugins/${name}/reload`);
      toast.success(`Plugin "${name}" configuration reloaded successfully!`);
    } catch (err: any) {
      toast.error(`Failed to reload plugin: ${err.response?.data?.message || err.message}`);
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
        <Card className="text-white text-xl">Loading plugins...</Card>
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
      <ScrollAnimatedItem delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Plugin Management</h1>
            <p className="text-gray-300">Manage server plugins ({plugins.length} total)</p>
          </div>
          <button
            onClick={fetchPlugins}
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
      </ScrollAnimatedItem>

      {/* Search Bar */}
      <ScrollAnimatedItem delay={0.1}>
        <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search plugins..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900/40 backdrop-blur-xl text-white placeholder-gray-500 rounded-xl border border-white/20 focus:border-primary-500 focus:outline-none transition-colors"
          />
        </div>
      </Card>
      </ScrollAnimatedItem>

      {/* Plugins Grid */}
      <ScrollAnimatedItem delay={0.2}>
        <div className="grid gap-4">
        {filteredPlugins.length === 0 ? (
          <Card className="text-center text-gray-400 py-8">
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
      </ScrollAnimatedItem>
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
    <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] p-6 rounded-lg hover:border-white/40 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-bold text-white">{plugin.name}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              plugin.enabled
                ? 'bg-green-900/30 text-green-400 border-green-500'
                : 'bg-gray-700 text-gray-400 border-gray-600'
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
      <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
        {plugin.enabled ? (
          <>
            <PermissionTooltip permission={Permission.MANAGE_PLUGINS}>
              <button
                onClick={() => onDisable(plugin.name)}
                disabled={loading}
                className="px-3 py-2 bg-gradient-to-br from-red-600/80 via-red-700/80 to-red-600/80 backdrop-blur-xl text-white rounded-xl hover:from-red-600 hover:via-red-700 hover:to-red-600 transition-colors font-medium border border-red-500/50 shadow-[0_4px_16px_0_rgba(239,68,68,0.3)] disabled:opacity-50 flex items-center gap-2"
              >
                <PowerOff className="w-4 h-4" />
                {loading ? 'Loading...' : 'Disable'}
              </button>
            </PermissionTooltip>
            <PermissionTooltip permission={Permission.MANAGE_PLUGINS}>
              <button
                onClick={() => onReload(plugin.name)}
                disabled={loading}
                className="px-3 py-2 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)] disabled:opacity-50 flex items-center gap-2"
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
              className="px-3 py-2 bg-gradient-to-br from-green-600/80 via-green-700/80 to-green-600/80 backdrop-blur-xl text-white rounded-xl hover:from-green-600 hover:via-green-700 hover:to-green-600 transition-colors font-medium border border-green-500/50 shadow-[0_4px_16px_0_rgba(34,197,94,0.3)] disabled:opacity-50 flex items-center gap-2"
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
