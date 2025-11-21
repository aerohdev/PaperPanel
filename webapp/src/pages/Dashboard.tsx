import { useEffect, useState } from 'react';
import client from '../api/client';
import { Activity, Users, HardDrive, Clock, Server, Boxes, RefreshCw } from 'lucide-react';
import type { DashboardStats } from '../types/api';
import { SkeletonGrid, SkeletonInfoCard } from '../components/Skeleton';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await client.get<DashboardStats>('/dashboard/stats');
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    try {
      await client.post('/dashboard/check-updates');
      setTimeout(() => {
        setCheckingUpdates(false);
        alert('Update check complete. Refresh the page if an update is available.');
      }, 3000);
    } catch (err) {
      alert('Failed to check updates');
      setCheckingUpdates(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Server overview and statistics</p>
          </div>
        </div>
        <SkeletonGrid columns={4} rows={1} />
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonInfoCard />
            <SkeletonInfoCard />
            <SkeletonInfoCard />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 text-center">
          <p className="text-xl font-bold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const tpsColor = stats.tps >= 19 ? 'text-green-500' : stats.tps >= 15 ? 'text-yellow-500' : 'text-red-500';
  const memoryPercent = Math.round((stats.memory.used / stats.memory.max) * 100);
  const memoryColor = memoryPercent < 70 ? 'text-green-500' : memoryPercent < 85 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="p-6 space-y-6">
      {/* Header with Check Updates Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Server overview and statistics</p>
        </div>
        <button
          onClick={handleCheckUpdates}
          disabled={checkingUpdates}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${checkingUpdates ? 'animate-spin' : ''}`} />
          {checkingUpdates ? 'Checking...' : 'Check for Updates'}
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TPS"
          value={stats.tps.toFixed(1)}
          icon={<Activity className="w-6 h-6" />}
          color={tpsColor}
          subtitle="Ticks per second"
        />

        <StatCard
          title="Players"
          value={`${stats.onlinePlayers}/${stats.maxPlayers}`}
          icon={<Users className="w-6 h-6" />}
          color="text-blue-500"
          subtitle="Online players"
        />

        <StatCard
          title="Memory"
          value={`${stats.memory.usedMB}MB / ${stats.memory.maxMB}MB`}
          icon={<HardDrive className="w-6 h-6" />}
          color={memoryColor}
          subtitle={`${memoryPercent}% used`}
        />

        <StatCard
          title="Uptime"
          value={stats.uptimeFormatted}
          icon={<Clock className="w-6 h-6" />}
          color="text-purple-500"
          subtitle="Server uptime"
        />
      </div>

      {/* Additional Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          title="Server Version"
          value={stats.bukkitVersion}
          icon={<Server className="w-5 h-5" />}
        />

        <InfoCard
          title="Loaded Chunks"
          value={stats.loadedChunks.toLocaleString()}
          icon={<Boxes className="w-5 h-5" />}
        />

        <InfoCard
          title="Plugins"
          value={stats.plugins.toString()}
          icon={<Boxes className="w-5 h-5" />}
        />
      </div>

      {/* World Information */}
      <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
        <h2 className="text-xl font-bold text-white mb-4">World Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Total Worlds</p>
            <p className="text-white text-2xl font-bold">{stats.worlds}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Loaded Chunks</p>
            <p className="text-white text-2xl font-bold">{stats.loadedChunks.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Memory Bar */}
      <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
        <h2 className="text-xl font-bold text-white mb-4">Memory Usage</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Used: {stats.memory.usedMB}MB</span>
            <span>Available: {stats.memory.maxMB}MB</span>
          </div>
          <div className="w-full bg-dark-bg rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                memoryPercent < 70 ? 'bg-green-500' : memoryPercent < 85 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${memoryPercent}%` }}
            ></div>
          </div>
          <p className="text-center text-gray-400 text-sm">{memoryPercent}% utilized</p>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="bg-dark-surface p-6 rounded-lg border border-dark-border hover:border-dark-hover transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        <div className={color}>{icon}</div>
      </div>
      <p className={`text-3xl font-bold ${color} mb-1`}>{value}</p>
      {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
    </div>
  );
}

interface InfoCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

function InfoCard({ title, value, icon }: InfoCardProps) {
  return (
    <div className="bg-dark-surface p-4 rounded-lg border border-dark-border">
      <div className="flex items-center mb-2">
        <div className="text-gray-400 mr-2">{icon}</div>
        <h3 className="text-gray-400 text-sm">{title}</h3>
      </div>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  );
}
