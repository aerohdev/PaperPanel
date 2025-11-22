import { useState, useEffect } from 'react';
import client from '../api/client';
import { FileText, Save, RefreshCw, FolderOpen, AlertCircle } from 'lucide-react';

interface ConfigFile {
  path: string;
  name: string;
  category: string;
  type: string;
  size: number;
  lastModified?: number;
}

export default function ConfigEditor() {
  const [configs, setConfigs] = useState<ConfigFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data } = await client.get<ConfigFile[]>('/configs');
      const configsArray = Array.isArray(data) ? data : [];
      setConfigs(configsArray);
      setError(null);
    } catch (err: any) {
      setError('Failed to load config files');
      console.error('Error fetching configs:', err);
    }
  };

  const loadFile = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.get(`/configs/read?path=${encodeURIComponent(path)}`);
      const fileContent = response.data.content || '';
      setContent(fileContent);
      setOriginalContent(fileContent);
      setSelectedFile(path);
    } catch (err: any) {
      setError('Failed to load file: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    
    if (!confirm('Are you sure you want to save changes to ' + selectedFile + '? A backup will be created automatically.')) {
      return;
    }
    
    setSaving(true);
    setError(null);
    try {
      await client.post('/configs/write', { 
        path: selectedFile, 
        content 
      });
      setOriginalContent(content);
      alert('File saved successfully! A backup was created in config-backups/');
    } catch (err: any) {
      setError('Failed to save: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = content !== originalContent;
  const serverConfigs = configs.filter(c => c.category === 'Server');
  const pluginConfigs = configs.filter(c => c.category === 'Plugin');

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* Sidebar */}
      <div className="w-80 bg-dark-surface rounded-lg border border-dark-border overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Config Files
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {configs.length} file(s) available
          </p>
        </div>

        {/* Server Configs */}
        {serverConfigs.length > 0 && (
          <div className="p-3">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">SERVER</h3>
            {serverConfigs.map(cfg => (
              <button
                key={cfg.path}
                onClick={() => loadFile(cfg.path)}
                className={`w-full text-left px-3 py-2 rounded mb-1 transition-colors ${
                  selectedFile === cfg.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-dark-hover'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{cfg.name}</div>
                    <div className="text-xs opacity-70">{(cfg.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Plugin Configs */}
        {pluginConfigs.length > 0 && (
          <div className="p-3 border-t border-dark-border">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">PLUGINS</h3>
            <div className="space-y-1">
              {pluginConfigs.map(cfg => (
                <button
                  key={cfg.path}
                  onClick={() => loadFile(cfg.path)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    selectedFile === cfg.path
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-dark-hover'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{cfg.name}</div>
                      <div className="text-xs opacity-70">{(cfg.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 bg-dark-surface rounded-lg border border-dark-border flex flex-col overflow-hidden">
        {selectedFile ? (
          <>
            {/* Editor Header */}
            <div className="p-4 border-b border-dark-border flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedFile}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {hasChanges && (
                    <span className="text-sm text-yellow-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Unsaved changes
                    </span>
                  )}
                  {!hasChanges && !loading && (
                    <span className="text-sm text-green-400">Saved</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadFile(selectedFile)}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-2"
                  title="Reload from disk"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Reload
                </button>
                <button
                  onClick={saveFile}
                  disabled={!hasChanges || saving}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                  title="Save changes (creates backup)"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-900/30 border-l-4 border-red-500 p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            )}

            {/* Editor Content */}
            <div className="flex-1 overflow-hidden relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="absolute inset-0 w-full h-full p-4 bg-dark-bg text-white font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
                placeholder="Loading..."
              />
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-dark-border flex items-center justify-between text-xs text-gray-400 flex-shrink-0">
              <div>
                Lines: {content.split('\n').length} • Characters: {content.length}
              </div>
              <div>
                Auto-backup enabled • Changes are logged
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No file selected</p>
              <p className="text-sm">Select a config file from the sidebar to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
