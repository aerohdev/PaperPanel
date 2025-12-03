import { useState, useEffect } from 'react';
import { Shield, UserPlus, Download, Upload, AlertCircle, X, Check, Crown } from 'lucide-react';
import axios from '../api/client';
import { TabNavigation, Tab } from '../components/TabNavigation';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ScrollAnimatedItem } from '../components/ScrollAnimatedItem';

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

const TABS: Tab[] = [
  { id: 'whitelist', label: 'Whitelist', icon: <Shield className="w-4 h-4" /> },
  { id: 'ops', label: 'Operators', icon: <Crown className="w-4 h-4" /> },
];

export default function WhitelistOps() {
  const [activeTab, setActiveTab] = useState<'whitelist' | 'ops'>('whitelist');
  const [whitelistData, setWhitelistData] = useState<WhitelistData>({ enabled: false, players: [] });
  const [opsData, setOpsData] = useState<OpsData>({ players: [] });
  const [newPlayerIdentifier, setNewPlayerIdentifier] = useState('');
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [playerToRemove, setPlayerToRemove] = useState<{ uuid: string; name: string } | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [whitelistResponse, opsResponse] = await Promise.all([
        axios.get('/whitelist'),
        axios.get('/ops')
      ]);
      setWhitelistData(whitelistResponse.data);
      setOpsData(opsResponse.data);
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const showMessage = (type: 'success' | 'error' | 'warning', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const toggleWhitelist = async () => {
    try {
      setToggleLoading(true);
      const endpoint = whitelistData.enabled ? '/whitelist/disable' : '/whitelist/enable';
      await axios.post(endpoint);
      showMessage('success', `Whitelist ${whitelistData.enabled ? 'disabled' : 'enabled'} successfully`);
      // Always reload whitelist data after toggling
      const response = await axios.get('/whitelist');
      setWhitelistData(response.data);
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Failed to toggle whitelist');
      // Reload data on error to ensure state is in sync
      try {
        const response = await axios.get('/whitelist');
        setWhitelistData(response.data);
      } catch (reloadError) {
        console.error('Failed to reload whitelist data:', reloadError);
      }
    } finally {
      setToggleLoading(false);
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

  const removePlayer = (uuid: string, name: string) => {
    setPlayerToRemove({ uuid, name });
  };

  const executeRemovePlayer = async () => {
    if (!playerToRemove) return;
    try {
      const endpoint = activeTab === 'whitelist'
        ? `/whitelist/remove/${playerToRemove.uuid}`
        : `/ops/remove/${playerToRemove.uuid}`;
      await axios.delete(endpoint);
      showMessage('success', `${playerToRemove.name} removed successfully`);
      await loadData();
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Failed to remove player');
    } finally {
      setPlayerToRemove(null);
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
    <>
      <ConfirmDialog
        isOpen={playerToRemove !== null}
        title={`Remove ${activeTab === 'whitelist' ? 'Whitelisted' : 'Operator'} Player`}
        message={`Are you sure you want to remove ${playerToRemove?.name}?`}
        onConfirm={executeRemovePlayer}
        onCancel={() => setPlayerToRemove(null)}
        variant="warning"
      />

      <div className="space-y-6">
      {/* Header */}
      <ScrollAnimatedItem delay={0}>
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Whitelist & Operators</h1>
        <p className="text-gray-400">Manage player whitelist and server operators</p>
      </div>
      </ScrollAnimatedItem>

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

      <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as 'whitelist' | 'ops')} />

      {/* Whitelist Toggle (only for whitelist tab) */}
      {activeTab === 'whitelist' && (
        <ScrollAnimatedItem delay={0.1}>
        <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 rounded-lg p-6 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Whitelist Status</h3>
              <p className={`text-sm transition-all duration-300 ${
                whitelistData.enabled
                  ? 'text-green-400'
                  : 'text-gray-400'
              }`}>
                {whitelistData.enabled
                  ? 'Only whitelisted players can join'
                  : 'All players can join'}
              </p>
            </div>
            <button
              onClick={toggleWhitelist}
              disabled={toggleLoading}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 backdrop-blur-xl border shadow-[0_4px_16px_0_rgba(0,0,0,0.4)] ${
                toggleLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${
                whitelistData.enabled
                  ? 'bg-gradient-to-r from-green-600/90 via-green-700/90 to-green-600/90 border-green-500/60 shadow-[0_4px_16px_0_rgba(34,197,94,0.4),0_0_30px_0_rgba(34,197,94,0.3)]'
                  : 'bg-gray-900/60 border-white/20 shadow-[0_4px_16px_0_rgba(0,0,0,0.4)]'
              }`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-lg duration-300 ${
                whitelistData.enabled ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
        </ScrollAnimatedItem>
      )}

      {/* Add Player Section */}
      <ScrollAnimatedItem delay={0.2}>
      <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 rounded-lg p-6 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)]">
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
            className="flex-1 bg-gray-900/40 backdrop-blur-xl border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addPlayer}
            className="px-6 py-2 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3),0_0_30px_0_rgba(37,99,235,0.2)]"
          >
            <UserPlus className="w-5 h-5" />
            Add Player
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          You can enter either a player name or UUID. A warning will be shown if the player has never joined.
        </p>
      </div>
      </ScrollAnimatedItem>

      {/* Import/Export Buttons */}
      <ScrollAnimatedItem delay={0.25}>
      <div className="flex gap-3">
        <button
          onClick={() => setShowImport(!showImport)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900/40 backdrop-blur-xl hover:bg-white/10 border border-white/20 text-white rounded-lg transition-colors"
        >
          <Upload className="w-5 h-5" />
          Bulk Import
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900/40 backdrop-blur-xl hover:bg-white/10 border border-white/20 text-white rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" />
          Export List
        </button>
      </div>
      </ScrollAnimatedItem>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="
            bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40
            backdrop-blur-3xl backdrop-saturate-150
            border border-white/20
            rounded-2xl
            shadow-[0_20px_60px_0_rgba(0,0,0,0.7),0_0_80px_0_rgba(138,92,246,0.2),inset_0_1px_0_0_rgba(255,255,255,0.2)]
            max-w-2xl w-full
            animate-scale-in
          ">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Bulk Import Players</h3>
              <button
                onClick={() => {
                  setShowImport(false);
                  setImportText('');
                }}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            <div className="p-6">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Enter player names or UUIDs, one per line..."
                rows={10}
                className="w-full bg-gray-900/40 backdrop-blur-xl border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="mt-2 text-xs text-gray-400">
                Enter one player name or UUID per line. Duplicates and invalid entries will be skipped.
              </p>
            </div>

            <div className="flex gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => {
                  setShowImport(false);
                  setImportText('');
                }}
                className="flex-1 px-4 py-2 bg-white/5 backdrop-blur-xl text-white rounded-xl hover:bg-white/10 transition-colors border border-white/10 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-medium shadow-lg"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Players List */}
      <ScrollAnimatedItem delay={0.3}>
      <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 rounded-lg p-6 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)]">
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
                className="bg-gray-900/40 backdrop-blur-xl rounded-lg p-4 border border-white/20 hover:border-blue-500/50 transition-colors"
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
      </ScrollAnimatedItem>
    </div>
    </>
  );
}
