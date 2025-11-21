import React, { useEffect, useState, useRef } from 'react';
import client from '../api/client';
import { Search, Download, RefreshCw, FileText, AlertCircle, XCircle } from 'lucide-react';
import type { LogFileInfo, LogMatch } from '../types/api';
import { SkeletonLogViewer } from '../components/Skeleton';

type LogType = 'audit' | 'security' | 'api' | 'server';

export default function LogViewer() {
  const [logFiles, setLogFiles] = useState<LogFileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [logContent, setLogContent] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LogMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<LogType>('audit');
  
  const wsRef = useRef<WebSocket | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    fetchLogFiles();
    return () => {
      disconnectWebSocket();
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logContent, autoScroll]);

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
    } catch (err) {
      console.error('Error downloading log:', err);
      alert('Failed to download log file');
    }
  };

  const connectWebSocket = (logType: LogType) => {
    disconnectWebSocket();
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/logs/${logType}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for log streaming');
      setStreaming(true);
      setLogContent([]);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'line' && message.data) {
          setLogContent(prev => [...prev.slice(-4999), message.data]); // Keep last 5000 lines
        } else if (message.type === 'error') {
          setError(message.message || 'Stream error');
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
      setStreaming(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setStreaming(false);
    };
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setStreaming(false);
    }
  };

  const toggleStreaming = () => {
    if (streaming) {
      disconnectWebSocket();
    } else {
      connectWebSocket(selectedType);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Log Viewer</h1>
          <p className="text-gray-400">View and search server logs with real-time streaming</p>
        </div>
        <button
          onClick={fetchLogFiles}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

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
        <div className="lg:col-span-1 space-y-4">
          {/* Real-time Streaming Controls */}
          <div className="bg-dark-surface rounded-lg p-4 border border-dark-border">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Live Stream
            </h3>
            <div className="space-y-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as LogType)}
                className="w-full bg-dark-bg border border-dark-border text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                disabled={streaming}
              >
                <option value="audit">Audit Logs</option>
                <option value="security">Security Logs</option>
                <option value="api">API Logs</option>
                <option value="server">Server Logs</option>
              </select>
              <button
                onClick={toggleStreaming}
                className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  streaming
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {streaming ? (
                  <>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Stop Stream
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Start Stream
                  </>
                )}
              </button>
              {streaming && (
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="rounded"
                  />
                  Auto-scroll
                </label>
              )}
            </div>
          </div>

          {/* Log Files */}
          <div className="bg-dark-surface rounded-lg p-4 border border-dark-border">
            <h3 className="text-white font-semibold mb-3">Log Files</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logFiles.map((file) => (
                <div
                  key={file.name}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    selectedFile === file.name
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-dark-bg border-dark-border hover:border-dark-hover'
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

        {/* Main Content - Log Viewer */}
        <div className="lg:col-span-3 space-y-4">
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
                className="w-full bg-dark-surface border border-dark-border text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={searchLogs}
              disabled={searching || !searchQuery.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
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
            <div className="bg-dark-surface rounded-lg p-4 border border-dark-border">
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
                    className="font-mono text-xs p-2 bg-dark-bg rounded hover:bg-dark-hover cursor-pointer"
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
          <div className="bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
            <div className="bg-dark-bg px-4 py-3 border-b border-dark-border flex items-center justify-between">
              <h3 className="text-white font-semibold">
                {streaming ? `Live: ${selectedType} logs` : selectedFile || 'No file selected'}
              </h3>
              <span className="text-gray-400 text-sm">
                {logContent.length} lines
              </span>
            </div>
            <div
              ref={logContainerRef}
              className="p-4 h-[600px] overflow-y-auto font-mono text-sm bg-black/40"
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
                  {streaming ? (
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Waiting for log entries...</p>
                    </div>
                  ) : (
                    <p>Select a log file or start live streaming</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
