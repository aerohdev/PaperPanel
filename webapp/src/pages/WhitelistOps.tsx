import { useState, useEffect } from 'react';
import { Shield, UserPlus, Download, Upload, AlertCircle, X, Check, Crown } from 'lucide-react';
import axios from '../api/client';

interface PlayerListEntry {
  uuid: string;
  name: string;
  online: boolean;
  hasPlayed: boolean;
  isOp?: boolean;
  isWhitelisted?: boolean;
}

interface WhitelistData {
  enabled: boolean;
  players: PlayerListEntry[];
}

interface OpsData {
  players: PlayerListEntry[];
}

export default function WhitelistOps() {
  const [activeTab, setActiveTab] = useState<'whitelist' | 'ops'>('whitelist');
  const [whitelistData, setWhitelistData] = useState<WhitelistData>({ enabled: false, players: [] });
  const [opsData, setOpsData] = useState<OpsData>({ players: [] });
  const [newPlayerIdentifier, setNewPlayerIdentifier] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'whitelist') {
        const response = await axios.get('/whitelist');
        setWhitelistData(response.data);
      } else {
        const response = await axios.get('/ops');
        setOpsData(response.data);
      }
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error' | 'warning', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const toggleWhitelist = async () => {
    try {
      const endpoint = whitelistData.enabled ? '/whitelist/disable' : '/whitelist/enable';
      await axios.post(endpoint);
      showMessage('success', `Whitelist ${whitelistData.enabled ? 'disabled' : 'enabled'} successfully`);
      await loadData();
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Failed to toggle whitelist');
    }
  };

  const addPlayer = async () => {
    if (!newPlayerIdentifier.trim()) {
      showMessage('error', 'Please enter a player name or UUID');
      return;
    }

    try {
      const endpoint = activeTab === 'whitelist' ? '/whitelist/add' : '/ops/add';
      const response = await axios.post(endpoint, { identifier: newPlayerIdentifier });
      
      if (response.data.warning) {
        showMessage('warning', response.data.warning);
      } else {
        showMessage('success', response.data.message);
      }
      
      setNewPlayerIdentifier('');
      await loadData();
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Failed to add player');
    }
  };

  const removePlayer = async (uuid: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;

    try {
      const endpoint = activeTab === 'whitelist' 
        ? `/whitelist/remove/${uuid}` 
        : `/ops/remove/${uuid}`;
      await axios.delete(endpoint);
      showMessage('success', `${name} removed successfully`);
      await loadData();
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Failed to remove player');
    }
  };

  const handleExport = async () => {
    try {
      const endpoint = activeTab === 'whitelist' ? '/whitelist/export' : '/ops/export';
      const response = await axios.get(endpoint);
      
      const content = response.data.players.join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      showMessage('success', 'Exported successfully');
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Failed to export');
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      showMessage('error', 'Please enter player names or UUIDs');
      return;
    }

    try {
      const players = importText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const endpoint = activeTab === 'whitelist' ? '/whitelist/import' : '/ops/import';
      const response = await axios.post(endpoint, { players });
      
      const { added, failed, warnings } = response.data;
      
      let msg = `Added ${added} player(s)`;
      if (failed.length > 0) msg += `, ${failed.length} failed`;
      if (warnings.length > 0) msg += `. Warnings: ${warnings.join(', ')}`;
      
      showMessage(failed.length > 0 ? 'warning' : 'success', msg);
      setImportText('');
      setShowImport(false);
      await loadData();
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Failed to import');
    }
  };

  const currentPlayers = activeTab === 'whitelist' ? whitelistData.players : opsData.players;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Whitelist & Operators</h1>
        <p className="text-gray-400">Manage player whitelist and server operators</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center justify-between ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
          message.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
          'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="hover:opacity-70">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-dark-surface rounded-lg p-1">
        <button
          onClick={() => setActiveTab('whitelist')}
          className={`flex-1 px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'whitelist'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-dark-hover'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span>Whitelist</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {whitelistData.players.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('ops')}
          className={`flex-1 px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'ops'
              ? 'bg-yellow-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-dark-hover'
          }`}
        >
          <Crown className="w-5 h-5" />
          <span>Operators</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {opsData.players.length}
          </span>
        </button>
      </div>

      {/* Whitelist Toggle (only for whitelist tab) */}
      {activeTab === 'whitelist' && (
        <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Whitelist Status</h3>
              <p className="text-sm text-gray-400">
                {whitelistData.enabled 
                  ? 'Only whitelisted players can join the server' 
                  : 'All players can join the server'}
              </p>
            </div>
            <button
              onClick={toggleWhitelist}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                whitelistData.enabled ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                whitelistData.enabled ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      )}

      {/* Add Player Section */}
      <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
        <h3 className="text-lg font-semibold text-white mb-4">
          Add {activeTab === 'whitelist' ? 'Whitelisted' : 'Operator'} Player
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newPlayerIdentifier}
            onChange={(e) => setNewPlayerIdentifier(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
            placeholder="Enter player name or UUID..."
            className="flex-1 bg-dark-hover border border-dark-border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addPlayer}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Add Player
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          You can enter either a player name or UUID. A warning will be shown if the player has never joined.
        </p>
      </div>

      {/* Import/Export Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowImport(!showImport)}
          className="flex items-center gap-2 px-4 py-2 bg-dark-surface hover:bg-dark-hover border border-dark-border text-white rounded-lg transition-colors"
        >
          <Upload className="w-5 h-5" />
          Bulk Import
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-dark-surface hover:bg-dark-hover border border-dark-border text-white rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" />
          Export List
        </button>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
          <h3 className="text-lg font-semibold text-white mb-4">Bulk Import Players</h3>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Enter player names or UUIDs, one per line..."
            rows={8}
            className="w-full bg-dark-hover border border-dark-border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleImport}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Import
            </button>
            <button
              onClick={() => {
                setShowImport(false);
                setImportText('');
              }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Players List */}
      <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
        <h3 className="text-lg font-semibold text-white mb-4">
          {activeTab === 'whitelist' ? 'Whitelisted' : 'Operator'} Players ({currentPlayers.length})
        </h3>
        
        {currentPlayers.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-16 h-16 rounded-full ${activeTab === 'whitelist' ? 'bg-blue-500/10' : 'bg-yellow-500/10'} flex items-center justify-center mx-auto mb-4`}>
              {activeTab === 'whitelist' ? (
                <Shield className={`w-8 h-8 ${activeTab === 'whitelist' ? 'text-blue-400' : 'text-yellow-400'}`} />
              ) : (
                <Crown className="w-8 h-8 text-yellow-400" />
              )}
            </div>
            <p className="text-gray-400">No {activeTab === 'whitelist' ? 'whitelisted' : 'operator'} players yet</p>
            <p className="text-sm text-gray-500 mt-1">Add players using the form above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentPlayers.map((player) => (
              <div
                key={player.uuid}
                className="bg-dark-hover rounded-lg p-4 border border-dark-border hover:border-blue-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://mc-heads.net/avatar/${player.uuid}/32`}
                      alt={player.name}
                      className="w-10 h-10 rounded"
                    />
                    <div>
                      <h4 className="text-white font-medium">{player.name}</h4>
                      <div className="flex gap-2 mt-1">
                        {player.online && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                            Online
                          </span>
                        )}
                        {!player.hasPlayed && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                            Never Joined
                          </span>
                        )}
                        {activeTab === 'whitelist' && player.isOp && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                            OP
                          </span>
                        )}
                        {activeTab === 'ops' && player.isWhitelisted && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                            Whitelisted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-mono mb-3 break-all">{player.uuid}</p>
                <button
                  onClick={() => removePlayer(player.uuid, player.name)}
                  className="w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
