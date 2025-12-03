import { useEffect, useState } from 'react';
import client from '../api/client';
import { Activity, Users, HardDrive, Clock, Server, Boxes, RefreshCw } from 'lucide-react';
import type { DashboardStats } from '../types/api';
import { SkeletonGrid, SkeletonInfoCard } from '../components/Skeleton';
import { StatCard, Card } from '../components/Card';
import ShinyText from '../components/ShinyText';
import { ScrollAnimatedItem } from '../components/ScrollAnimatedItem';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 5 seconds (increased from 3 to reduce flickering)
    const interval = setInterval(() => {
      fetchStats();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const response = await client.get<DashboardStats>('/dashboard/stats');
      setStats(response.data);
      setLastUpdate(new Date());
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stats:', err);
      if (loading) {
        setError('Failed to load dashboard stats');
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 800); // Keep shiny animation visible
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Dashboard</h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">Server overview and statistics</p>
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
        <Card className="text-red-500 text-center max-w-md">
          <p className="text-xl font-bold mb-2">Error</p>
          <p>{error}</p>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const tpsColor = stats.tps >= 19 ? 'text-green-500' : stats.tps >= 15 ? 'text-yellow-500' : 'text-red-500';
  const memoryPercent = Math.round((stats.memory.used / stats.memory.max) * 100);
  const memoryColor = memoryPercent < 70 ? 'text-green-500' : memoryPercent < 75 ? 'text-yellow-500' : 'text-red-500';

  // Player capacity calculation
  const playerPercent = Math.round((stats.onlinePlayers / stats.maxPlayers) * 100);
  const playerCapacityHigh = playerPercent >= 75;

  // Uptime day calculation
  const uptimeDays = (() => {
    // Parse uptime string (e.g., "5d 12h 34m" or "12h 34m" or "34m")
    const match = stats.uptimeFormatted.match(/(\d+)d/);
    return match ? parseInt(match[1]) : 0;
  })();
  const uptimeTooLong = uptimeDays >= 30;

  return (
    <div className="p-6 space-y-6">
      {/* Header with Shiny Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-300">
            Server overview and statistics •
            <span className="text-green-500 ml-1">Live</span> •
            Last update: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isRefreshing}
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
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? (
            <ShinyText text="Refreshing..." speed={3} />
          ) : (
            <span>Refresh</span>
          )}
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScrollAnimatedItem delay={0}>
          <StatCard
            title="TPS"
            value={stats.tps.toFixed(1)}
            change={stats.tps >= 19 ? "Excellent" : stats.tps >= 15 ? "Good" : "Server under load"}
            changeType={stats.tps >= 15 ? "up" : "down"}
            icon={<Activity className="w-6 h-6" />}
            gradient="blue"
          />
        </ScrollAnimatedItem>

        <ScrollAnimatedItem delay={0.1}>
          <StatCard
            title="Players"
            value={`${stats.onlinePlayers}/${stats.maxPlayers}`}
            change={playerCapacityHigh ? "High player count" : `${playerPercent}% capacity`}
            changeType={playerCapacityHigh ? "down" : "up"}
            icon={<Users className="w-6 h-6" />}
            gradient="purple"
          />
        </ScrollAnimatedItem>

        <ScrollAnimatedItem delay={0.2}>
          <StatCard
            title="Memory"
            value={`${stats.memory.usedMB}MB`}
            change={memoryPercent >= 75 ? "High memory usage" : `${memoryPercent}% used`}
            changeType={memoryPercent >= 75 ? "down" : "up"}
            icon={<HardDrive className="w-6 h-6" />}
            gradient="pink"
          />
        </ScrollAnimatedItem>

        <ScrollAnimatedItem delay={0.3}>
          <StatCard
            title="Uptime"
            value={stats.uptimeFormatted}
            change={uptimeTooLong ? "Restart recommended" : "Running smoothly"}
            changeType={uptimeTooLong ? "down" : "up"}
            icon={<Clock className="w-6 h-6" />}
            gradient="green"
          />
        </ScrollAnimatedItem>
      </div>

      {/* Additional Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScrollAnimatedItem delay={0}>
          <Card>
            <div className="flex items-center mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mr-3">
                <Server className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-gray-300 text-sm">Server Version</h3>
            </div>
            <p className="text-white text-xl font-bold">{stats.bukkitVersion}</p>
          </Card>
        </ScrollAnimatedItem>

        <ScrollAnimatedItem delay={0.1}>
          <Card>
            <div className="flex items-center mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 mr-3">
                <Boxes className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-gray-300 text-sm">Loaded Chunks</h3>
            </div>
            <p className="text-white text-xl font-bold">{stats.loadedChunks.toLocaleString()}</p>
          </Card>
        </ScrollAnimatedItem>

        <ScrollAnimatedItem delay={0.2}>
          <Card>
            <div className="flex items-center mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20 mr-3">
                <Boxes className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-gray-300 text-sm">Plugins</h3>
            </div>
            <p className="text-white text-xl font-bold">{stats.plugins.toString()}</p>
          </Card>
        </ScrollAnimatedItem>
      </div>

      {/* World Information */}
      <ScrollAnimatedItem delay={0}>
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">World Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-300 text-sm mb-1">Total Worlds</p>
              <p className="text-white text-2xl font-bold">{stats.worlds}</p>
            </div>
            <div>
              <p className="text-gray-300 text-sm mb-1">Loaded Chunks</p>
              <p className="text-white text-2xl font-bold">{stats.loadedChunks.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </ScrollAnimatedItem>

      {/* Memory Bar */}
      <ScrollAnimatedItem delay={0.1}>
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">Memory Usage</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Used: {stats.memory.usedMB}MB</span>
              <span>Available: {stats.memory.maxMB}MB</span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                style={{ width: `${memoryPercent}%` }}
                className={`h-full transition-all duration-500 rounded-full ${
                  memoryPercent < 70
                    ? 'bg-emerald-500'
                    : memoryPercent < 75
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              ></div>
            </div>
            <p className="text-center text-gray-300 text-sm font-medium">
              {memoryPercent}% utilized
            </p>
          </div>
        </Card>
      </ScrollAnimatedItem>
    </div>
  );
}
