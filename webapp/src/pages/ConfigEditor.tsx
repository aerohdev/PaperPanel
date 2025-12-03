import { useState, useEffect } from 'react';
import client from '../api/client';
import { FileText, Save, RefreshCw, FolderOpen, AlertCircle, ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ScrollAnimatedItem } from '../components/ScrollAnimatedItem';

interface ConfigFile {
  path: string;
  name: string;
  category: string;
  type: string;
  size: number;
  lastModified?: number;
  plugin?: string; // Plugin name for plugin configs
  relativePath?: string; // Path relative to plugin folder
}

export default function ConfigEditor() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<ConfigFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [expandedPlugins, setExpandedPlugins] = useState<Set<string>>(new Set());

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

  const handleSaveClick = () => {
    if (!selectedFile) return;
    setShowSaveConfirm(true);
  };

  const saveFile = async () => {
    if (!selectedFile) return;

    setSaving(true);
    setError(null);
    try {
      await client.post('/configs/write', {
        path: selectedFile,
        content
      });
      setOriginalContent(content);
      toast.success('File saved successfully! A backup was created.');
    } catch (err: any) {
      toast.error('Failed to save: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const togglePlugin = (pluginName: string) => {
    setExpandedPlugins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pluginName)) {
        newSet.delete(pluginName);
      } else {
        newSet.add(pluginName);
      }
      return newSet;
    });
  };

  const hasChanges = content !== originalContent;
  const serverConfigs = configs.filter(c => c.category === 'Server');
  const pluginConfigs = configs.filter(c => c.category === 'Plugin');

  // Group plugin configs by plugin name
  const pluginsByName = pluginConfigs.reduce((acc, cfg) => {
    const pluginName = cfg.plugin || 'Unknown';
    if (!acc[pluginName]) {
      acc[pluginName] = [];
    }
    acc[pluginName].push(cfg);
    return acc;
  }, {} as Record<string, ConfigFile[]>);

  const sortedPluginNames = Object.keys(pluginsByName).sort();

  return (
    <>
      <ConfirmDialog
        isOpen={showSaveConfirm}
        title="Save Configuration"
        message={`Are you sure you want to save changes to ${selectedFile}? A backup will be created automatically.`}
        onConfirm={() => {
          saveFile();
          setShowSaveConfirm(false);
        }}
        onCancel={() => setShowSaveConfirm(false)}
        variant="warning"
      />

      <div className="flex h-[calc(100vh-150px)] gap-4 p-6">
      {/* Sidebar */}
      <ScrollAnimatedItem delay={0} className="w-80 flex-shrink-0">
      <div className="h-full bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] rounded-lg overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-white/20">
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
                    : 'text-gray-300 hover:bg-white/10'
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
        {sortedPluginNames.length > 0 && (
          <div className="p-3 border-t border-white/20">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">PLUGINS</h3>
            <div className="space-y-1">
              {sortedPluginNames.map(pluginName => {
                const isExpanded = expandedPlugins.has(pluginName);
                const files = pluginsByName[pluginName];

                return (
                  <div key={pluginName}>
                    {/* Plugin Folder Header */}
                    <button
                      onClick={() => togglePlugin(pluginName)}
                      className="w-full text-left px-2 py-2 rounded transition-colors text-gray-300 hover:bg-white/10 flex items-center gap-2"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      )}
                      <Folder className="w-4 h-4 flex-shrink-0 text-yellow-500" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{pluginName}</div>
                        <div className="text-xs text-gray-400">
                          {files.length} file{files.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </button>

                    {/* Plugin Files */}
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {files.map(cfg => (
                          <button
                            key={cfg.path}
                            onClick={() => loadFile(cfg.path)}
                            className={`w-full text-left px-3 py-2 rounded transition-colors ${
                              selectedFile === cfg.path
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm truncate">{cfg.relativePath || cfg.name}</div>
                                <div className={`text-xs ${selectedFile === cfg.path ? 'text-white/70' : 'text-gray-400'}`}>
                                  {(cfg.size / 1024).toFixed(1)} KB
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </ScrollAnimatedItem>

      {/* Editor */}
      <ScrollAnimatedItem delay={0.1} className="flex-1 min-w-0">
      <div className="h-full bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] rounded-lg flex flex-col overflow-hidden">
        {selectedFile ? (
          <>
            {/* Editor Header */}
            <div className="p-4 border-b border-white/20 flex items-center justify-between flex-shrink-0">
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
                  className="px-4 py-2 bg-gray-900/40 backdrop-blur-xl text-white rounded-lg hover:bg-white/10 transition disabled:opacity-50 flex items-center gap-2 border border-white/20 shadow-[0_4px_16px_0_rgba(0,0,0,0.4),0_0_30px_0_rgba(138,92,246,0.1)]"
                  title="Reload from disk"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Reload
                </button>
                <button
                  onClick={handleSaveClick}
                  disabled={!hasChanges || saving}
                  className="px-4 py-2 bg-gradient-to-br from-green-600/80 via-green-700/80 to-green-600/80 backdrop-blur-xl text-white rounded-lg hover:from-green-600 hover:via-green-700 hover:to-green-600 transition disabled:opacity-50 flex items-center gap-2 border border-green-500/50 shadow-[0_4px_16px_0_rgba(34,197,94,0.3)]"
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
                className="absolute inset-0 w-full h-full p-4 bg-gray-900/40 backdrop-blur-xl text-white font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
                placeholder="Loading..."
              />
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-white/20 flex items-center justify-between text-xs text-gray-400 flex-shrink-0">
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
      </ScrollAnimatedItem>
    </div>
    </>
  );
}
