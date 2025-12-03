import React, { useEffect, useState, useRef } from 'react';
import client from '../api/client';
import { Search, Download, RefreshCw, AlertCircle, XCircle } from 'lucide-react';
import type { LogFileInfo, LogMatch } from '../types/api';
import { SkeletonLogViewer } from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { ScrollAnimatedItem } from '../components/ScrollAnimatedItem';

export default function LogViewer() {
  const { toast } = useToast();
  const [logFiles, setLogFiles] = useState<LogFileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [logContent, setLogContent] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LogMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogFiles();
  }, []);

  const fetchLogFiles = async () => {
    try {
      setLoading(true);
      const response = await client.get<LogFileInfo[]>('/logs/files');
      setLogFiles(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching log files:', err);
      setError('Failed to load log files');
    } finally {
      setLoading(false);
    }
  };

  const loadLogFile = async (filename: string) => {
    try {
      setLoading(true);
      setSelectedFile(filename);
      setSearchResults([]);
      setSearchQuery('');
      
      const response = await client.get<{ lines: string[] }>(`/logs/read/${filename}`);
      setLogContent(response.data.lines || []);
      setError(null);
    } catch (err) {
      console.error('Error loading log file:', err);
      setError('Failed to load log content');
      setLogContent([]);
    } finally {
      setLoading(false);
    }
  };

  const searchLogs = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await client.post<LogMatch[]>('/logs/search', {
        query: searchQuery,
        files: selectedFile ? [selectedFile] : undefined,
        limit: 200
      });
      setSearchResults(response.data);
      setError(null);
    } catch (err) {
      console.error('Error searching logs:', err);
      setError('Failed to search logs');
    } finally {
      setSearching(false);
    }
  };

  const downloadLog = async (filename: string) => {
    try {
      const response = await client.get(`/logs/download/${filename}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (err) {
      console.error('Error downloading log:', err);
      toast.error('Failed to download log file');
    }
  };


  const getLogTypeColor = (type: string): string => {
    if (type.includes('audit')) return 'text-blue-400';
    if (type.includes('security')) return 'text-red-400';
    if (type.includes('api')) return 'text-green-400';
    return 'text-gray-400';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading && logFiles.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-white mb-6">Log Viewer</h1>
        <SkeletonLogViewer />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <ScrollAnimatedItem delay={0}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Log Viewer</h1>
          <p className="text-gray-400">View and search server logs</p>
        </div>
        <button
          onClick={fetchLogFiles}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl hover:bg-white/10 text-white rounded-xl transition-all duration-300 border border-white/10"
          title="Refresh now"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
      </ScrollAnimatedItem>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <XCircle className="w-5 h-5 text-red-500 hover:text-red-400" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Log Files List */}
        <ScrollAnimatedItem delay={0.1} className="lg:col-span-1">
        <div className="space-y-4">

          {/* Log Files */}
          <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Log Files</h3>
            <div className="space-y-2 overflow-y-auto max-h-[600px]">
              {logFiles.map((file) => (
                <div
                  key={file.name}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    selectedFile === file.name
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-gray-900/40 backdrop-blur-xl border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => loadLogFile(file.name)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-mono ${getLogTypeColor(file.type)}`}>
                      {file.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadLog(file.name);
                      }}
                      className="text-gray-400 hover:text-white"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    {file.lines && <span>{file.lines} lines</span>}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {formatDate(file.modified)}
                  </div>
                </div>
              ))}
              {logFiles.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No log files found</p>
              )}
            </div>
          </div>
        </div>
        </ScrollAnimatedItem>

        {/* Main Content - Log Viewer */}
        <ScrollAnimatedItem delay={0.2} className="lg:col-span-3">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchLogs()}
                placeholder="Search logs (max 200 results)..."
                className="w-full bg-gray-900/40 backdrop-blur-xl border border-white/20 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={searchLogs}
              disabled={searching || !searchQuery.trim()}
              className="px-6 py-3 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 disabled:from-gray-600/80 disabled:to-gray-700/80 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3),0_0_30px_0_rgba(37,99,235,0.2)] disabled:shadow-none"
            >
              {searching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">
                  Search Results ({searchResults.length})
                </h3>
                <button
                  onClick={() => setSearchResults([])}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {searchResults.map((match, index) => (
                  <div
                    key={index}
                    className="font-mono text-xs p-2 bg-gray-900/40 backdrop-blur-xl rounded hover:bg-white/10 cursor-pointer"
                  >
                    <span className="text-gray-500 mr-2">{match.lineNumber}:</span>
                    <span className="text-gray-300">{match.line}</span>
                    {match.file && (
                      <span className="text-gray-600 ml-2">({match.file})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log Content */}
          <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] rounded-lg overflow-hidden">
            <div className="bg-gray-900/40 backdrop-blur-xl px-4 py-3 border-b border-white/20 flex items-center justify-between">
              <h3 className="text-white font-semibold">
                {selectedFile || 'No file selected'}
              </h3>
              <span className="text-gray-400 text-sm">
                {logContent.length} lines
              </span>
            </div>
            <div
              ref={logContainerRef}
              className="p-4 overflow-y-auto font-mono text-sm bg-black/40 max-h-[500px]"
            >
              {logContent.length > 0 ? (
                logContent.map((line, index) => (
                  <div
                    key={index}
                    className="text-gray-300 hover:bg-gray-800/50 px-2 py-0.5 whitespace-pre-wrap break-all"
                  >
                    <span className="text-gray-600 select-none mr-2">
                      {(index + 1).toString().padStart(4, '0')}
                    </span>
                    {line}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Select a log file to view its contents</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </ScrollAnimatedItem>
      </div>
    </div>
  );
}
