import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { FileText, Filter, RefreshCw, AlertCircle, Shield, Terminal } from 'lucide-react';
import { ScrollAnimatedItem } from '../components/ScrollAnimatedItem';

interface AuditLogEntry {
  timestamp: number;
  category: string;
  level: string;
  username: string | null;
  message: string;
}

interface AuditStats {
  totalEntries: number;
  totalSizeMB: number;
  categoryCounts: {
    audit: number;
    security: number;
    api: number;
  };
  fileCount: number;
}

export function AuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [category, setCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, [category, searchTerm, levelFilter, offset]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        category,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const [entriesRes, statsRes] = await Promise.all([
        apiClient.get(`/audit/entries?${params.toString()}`),
        apiClient.get('/audit/stats'),
      ]);

      console.log('Audit entries response:', entriesRes.data);
      console.log('Audit stats response:', statsRes.data);

      if (entriesRes.data) {
        let filteredEntries = entriesRes.data.entries || [];
        
        // Apply level filter client-side
        if (levelFilter !== 'all') {
          filteredEntries = filteredEntries.filter((e: AuditLogEntry) => 
            e.level.toLowerCase() === levelFilter.toLowerCase()
          );
        }
        
        setEntries(filteredEntries);
        setTotal(entriesRes.data.total || 0);
      }

      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
      console.error('Load audit logs error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getLevelColor = (level: string): string => {
    switch (level.toUpperCase()) {
      case 'SEVERE':
      case 'ERROR':
        return 'text-red-400 bg-red-900/30 border-red-500';
      case 'WARNING':
      case 'WARN':
        return 'text-yellow-400 bg-yellow-900/30 border-yellow-500';
      case 'INFO':
      default:
        return 'text-blue-400 bg-blue-900/30 border-blue-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'api':
        return <Terminal className="w-4 h-4" />;
      case 'audit':
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'security':
        return 'text-red-400 bg-red-900/20';
      case 'api':
        return 'text-purple-400 bg-purple-900/20';
      case 'audit':
      default:
        return 'text-green-400 bg-green-900/20';
    }
  };

  if (isLoading && !entries.length) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      {/* Header */}
      <ScrollAnimatedItem delay={0} className="flex-shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-gray-400">View system activity and security events</p>
        </div>
        <button
          onClick={() => loadData()}
          disabled={isLoading}
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
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      </ScrollAnimatedItem>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <ScrollAnimatedItem delay={0.1} className="flex-shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Total Entries</div>
            <div className="text-2xl font-bold text-white">{stats.totalEntries.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Audit Events</div>
            <div className="text-2xl font-bold text-green-400">{stats.categoryCounts.audit.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Security Events</div>
            <div className="text-2xl font-bold text-red-400">{stats.categoryCounts.security.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">API Events</div>
            <div className="text-2xl font-bold text-purple-400">{stats.categoryCounts.api.toLocaleString()}</div>
          </div>
        </div>
        </ScrollAnimatedItem>
      )}

      {/* Filters */}
      <ScrollAnimatedItem delay={0.2} className="flex-shrink-0">
      <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setOffset(0);
              }}
              className="w-full px-3 py-2 bg-gray-900/40 backdrop-blur-xl text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none [&>option]:bg-gray-900 [&>option]:text-white"
            >
              <option value="all">All Categories</option>
              <option value="audit">Audit</option>
              <option value="security">Security</option>
              <option value="api">API</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Level</label>
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setOffset(0);
              }}
              className="w-full px-3 py-2 bg-gray-900/40 backdrop-blur-xl text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none [&>option]:bg-gray-900 [&>option]:text-white"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="severe">Severe</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setOffset(0);
              }}
              placeholder="Search messages..."
              className="w-full px-3 py-2 bg-gray-900/40 backdrop-blur-xl text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
      </ScrollAnimatedItem>

      {/* Log Entries */}
      <ScrollAnimatedItem delay={0.3} className="flex-1 flex flex-col min-h-[500px]">
      <div className="flex-1 bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] rounded-lg overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-900/40 backdrop-blur-xl border-b border-white/20">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No audit log entries found
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => (
                  <tr key={index} className="hover:bg-white/10 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getCategoryColor(entry.category)}`}>
                        {getCategoryIcon(entry.category)}
                        {entry.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getLevelColor(entry.level)}`}>
                        {entry.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {entry.username || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {entry.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="px-4 py-3 border-t border-white/20 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {offset + 1} to {Math.min(offset + limit, total || entries.length)} of {total || entries.length} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-3 py-1 bg-gray-900/40 backdrop-blur-xl text-white rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="px-3 py-1 bg-gray-900/40 backdrop-blur-xl text-white rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      </ScrollAnimatedItem>
    </div>
  );
}
