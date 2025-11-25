import { useEffect, useState } from 'react';
import client from '../api/client';
import { Activity, Users, HardDrive, Clock, Server, Boxes, RefreshCw } from 'lucide-react';
import type { DashboardStats } from '../types/api';
import { SkeletonGrid, SkeletonInfoCard } from '../components/Skeleton';
import { StatCard, Card } from '../components/Card';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 5 seconds (increased from 3 to reduce flickering)
    const interval = setInterval(() => {
      fetchStats();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
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
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Dashboard</h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">Server overview and statistics</p>
          </div>
        </motion.div>
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
  const memoryColor = memoryPercent < 70 ? 'text-green-500' : memoryPercent < 85 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="p-6 space-y-6">
      {/* Header with Check Updates Button */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Dashboard</h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Server overview and statistics • 
            <span className="text-green-500 ml-1">Live</span> • 
            Last update: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={fetchStats}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-light-card dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border text-light-text-primary dark:text-dark-text-primary rounded-xl transition-colors shadow-soft dark:shadow-dark-soft border border-light-border dark:border-dark-border"
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </motion.button>
          <motion.button
            onClick={handleCheckUpdates}
            disabled={checkingUpdates}
            whileHover={{ scale: checkingUpdates ? 1 : 1.05 }}
            whileTap={{ scale: checkingUpdates ? 1 : 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-purple hover:from-primary-600 hover:to-accent-purple/90 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-medium dark:shadow-dark-medium"
          >
            <RefreshCw className={`w-4 h-4 ${checkingUpdates ? 'animate-spin' : ''}`} />
            {checkingUpdates ? 'Checking...' : 'Check for Updates'}
          </motion.button>
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TPS"
          value={stats.tps.toFixed(1)}
          change={stats.tps >= 19 ? "Excellent" : stats.tps >= 15 ? "Good" : "Poor"}
          changeType={stats.tps >= 15 ? "up" : "down"}
          icon={<Activity className="w-6 h-6" />}
          gradient="blue"
        />

        <StatCard
          title="Players"
          value={`${stats.onlinePlayers}/${stats.maxPlayers}`}
          change={`${Math.round((stats.onlinePlayers / stats.maxPlayers) * 100)}% capacity`}
          icon={<Users className="w-6 h-6" />}
          gradient="purple"
        />

        <StatCard
          title="Memory"
          value={`${stats.memory.usedMB}MB`}
          change={`${memoryPercent}% used`}
          changeType={memoryPercent < 85 ? "up" : "down"}
          icon={<HardDrive className="w-6 h-6" />}
          gradient="pink"
        />

        <StatCard
          title="Uptime"
          value={stats.uptimeFormatted}
          change="Running smoothly"
          changeType="up"
          icon={<Clock className="w-6 h-6" />}
          gradient="green"
        />
      </div>

      {/* Additional Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mr-3">
              <Server className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-light-text-secondary dark:text-dark-text-secondary text-sm">Server Version</h3>
          </div>
          <p className="text-light-text-primary dark:text-dark-text-primary text-xl font-bold">{stats.bukkitVersion}</p>
        </Card>

        <Card>
          <div className="flex items-center mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 mr-3">
              <Boxes className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-light-text-secondary dark:text-dark-text-secondary text-sm">Loaded Chunks</h3>
          </div>
          <p className="text-light-text-primary dark:text-dark-text-primary text-xl font-bold">{stats.loadedChunks.toLocaleString()}</p>
        </Card>

        <Card>
          <div className="flex items-center mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20 mr-3">
              <Boxes className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-light-text-secondary dark:text-dark-text-secondary text-sm">Plugins</h3>
          </div>
          <p className="text-light-text-primary dark:text-dark-text-primary text-xl font-bold">{stats.plugins.toString()}</p>
        </Card>
      </div>

      {/* World Information */}
      <Card>
        <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">World Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm mb-1">Total Worlds</p>
            <p className="text-light-text-primary dark:text-dark-text-primary text-2xl font-bold">{stats.worlds}</p>
          </div>
          <div>
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm mb-1">Loaded Chunks</p>
            <p className="text-light-text-primary dark:text-dark-text-primary text-2xl font-bold">{stats.loadedChunks.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Memory Bar */}
      <Card>
        <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">Memory Usage</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-light-text-secondary dark:text-dark-text-secondary">
            <span>Used: {stats.memory.usedMB}MB</span>
            <span>Available: {stats.memory.maxMB}MB</span>
          </div>
          <div className="w-full bg-light-border/30 dark:bg-dark-border/30 rounded-full h-4 overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${memoryPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full transition-all duration-500 rounded-full ${
                memoryPercent < 70
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : memoryPercent < 85
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}
            ></motion.div>
          </div>
          <p className="text-center text-light-text-secondary dark:text-dark-text-secondary text-sm font-medium">
            {memoryPercent}% utilized
          </p>
        </div>
      </Card>
    </div>
  );
}
