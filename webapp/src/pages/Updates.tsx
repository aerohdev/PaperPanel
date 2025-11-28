import { useEffect, useState } from 'react';
import client from '../api/client';
import { Download, RefreshCw, Clock, History, HardDrive, Calendar, Trash2, Settings, Check, X, Archive, Play, Server } from 'lucide-react';
import type { UpdateStatus, BackupInfo, AutoBackupSchedule, UpdateHistoryEntry, ScheduledUpdate } from '../types/api';
import { PermissionTooltip } from '../components/PermissionTooltip';
import { Permission } from '../constants/permissions';
import { Card } from '../components/Card';
import { useToast } from '../contexts/ToastContext';
import { TabNavigation, Tab } from '../components/TabNavigation';

type TabType = 'updates' | 'backups';

const TABS: Tab[] = [
  { id: 'updates', label: 'Server Updates', icon: <Download className="w-4 h-4" /> },
  { id: 'backups', label: 'Backup Management', icon: <HardDrive className="w-4 h-4" /> },
];

export default function Updates() {
  const [activeTab, setActiveTab] = useState<TabType>('updates');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Updates & Backups</h1>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">Manage server updates and backups</p>
      </div>

      <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as TabType)} />

      {activeTab === 'updates' ? <UpdatesTab /> : <BackupsTab />}
    </div>
  );
}

// ===== Updates Tab =====
function UpdatesTab() {
  const { toast } = useToast();
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [updateHistory, setUpdateHistory] = useState<UpdateHistoryEntry[]>([]);
  const [scheduledUpdates, setScheduledUpdates] = useState<ScheduledUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, historyRes, scheduledRes] = await Promise.all([
        client.get('/updates/status'),
        client.get('/updates/history'),
        client.get('/updates/scheduled'),
      ]);
      setUpdateStatus(statusRes.data);
      setUpdateHistory(historyRes.data || []);
      setScheduledUpdates(scheduledRes.data || []);
    } catch (err) {
      console.error('Error fetching update data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckForUpdates = async () => {
    setActionLoading('check');
    try {
      await client.post('/updates/check');
      toast.info('Checking for updates...');
      setTimeout(() => fetchData(), 3000);
    } catch (err: any) {
      toast.error('Failed to check for updates: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadUpdate = async () => {
    setActionLoading('download');
    try {
      await client.post('/updates/download');
      toast.info('Update download started. Check server logs for progress.');
      setTimeout(() => fetchData(), 5000);
    } catch (err: any) {
      toast.error('Failed to download update: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleInstallUpdate = async () => {
    if (!confirm('This will restart the server in 5 minutes. Continue?')) return;
    setActionLoading('install');
    try {
      await client.post('/updates/install');
      toast.warning('Update installation started. Server will restart in 5 minutes.');
    } catch (err: any) {
      toast.error('Failed to install update: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleScheduleUpdate = async () => {
    if (!scheduleTime) {
      toast.warning('Please select a time');
      return;
    }
    const scheduledTimestamp = new Date(scheduleTime).getTime();
    if (scheduledTimestamp <= Date.now()) {
      toast.warning('Scheduled time must be in the future');
      return;
    }
    try {
      await client.post('/updates/schedule', { scheduledTime: scheduledTimestamp });
      toast.success('Update scheduled successfully!');
      setShowScheduleModal(false);
      setScheduleTime('');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to schedule update: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCancelScheduled = async (id: number) => {
    if (!confirm('Cancel this scheduled update?')) return;
    try {
      await client.delete(`/updates/schedule/${id}`);
      toast.success('Scheduled update cancelled');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to cancel: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-light-text-primary dark:text-dark-text-primary">Loading update information...</Card>;
  }

  return (
    <div className="space-y-6">
      {/* Current Version & Update Status */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2 flex items-center gap-2">
              <Server className="w-5 h-5 text-primary-500" />
              Current Version
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-lg">
              {updateStatus?.currentVersion || 'Unknown'}
            </p>
            {updateStatus?.lastCheck && (
              <p className="text-light-text-muted dark:text-dark-text-muted text-sm mt-2">
                Last checked: {new Date(updateStatus.lastCheck).toLocaleString()}
              </p>
            )}
          </div>
          <PermissionTooltip permission={Permission.MANAGE_UPDATES}>
            <button
              onClick={handleCheckForUpdates}
              disabled={actionLoading === 'check'}
              className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading === 'check' ? 'animate-spin' : ''}`} />
              Check for Updates
            </button>
          </PermissionTooltip>
        </div>
      </Card>

      {/* Update Available Banner */}
      {updateStatus?.updateAvailable && (
        <Card className="bg-blue-600/10 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-light-text-primary dark:text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-400" />
                Update Available!
              </h3>
              <p className="text-light-text-secondary dark:text-gray-300">
                Paper {updateStatus.latestVersion} Build #{updateStatus.latestBuild}
              </p>
            </div>
            <div className="flex gap-2">
              {!updateStatus.updateDownloaded ? (
                <PermissionTooltip permission={Permission.MANAGE_UPDATES}>
                  <button
                    onClick={handleDownloadUpdate}
                    disabled={actionLoading === 'download'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {actionLoading === 'download' ? 'Downloading...' : 'Download'}
                  </button>
                </PermissionTooltip>
              ) : (
                <>
                  <PermissionTooltip permission={Permission.MANAGE_UPDATES}>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule
                    </button>
                  </PermissionTooltip>
                  <PermissionTooltip permission={Permission.MANAGE_UPDATES}>
                    <button
                      onClick={handleInstallUpdate}
                      disabled={actionLoading === 'install'}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      {actionLoading === 'install' ? 'Installing...' : 'Install Now'}
                    </button>
                  </PermissionTooltip>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Scheduled Updates */}
      {scheduledUpdates.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            Scheduled Updates
          </h2>
          <div className="space-y-2">
            {scheduledUpdates.map(update => (
              <div key={update.id} className="flex items-center justify-between p-3 bg-light-surface dark:bg-dark-surface rounded-lg">
                <div>
                  <p className="text-light-text-primary dark:text-white font-medium">
                    {update.version} Build #{update.buildNumber}
                  </p>
                  <p className="text-light-text-muted dark:text-gray-400 text-sm">
                    Scheduled for: {new Date(update.scheduledTime).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleCancelScheduled(update.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 text-sm"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Update History */}
      <Card>
        <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-green-500" />
          Update History
        </h2>
        {updateHistory.length === 0 ? (
          <p className="text-light-text-muted dark:text-dark-text-muted text-center py-4">No update history available</p>
        ) : (
          <div className="space-y-2">
            {updateHistory.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-light-surface dark:bg-dark-surface rounded-lg">
                <div>
                  <p className="text-light-text-primary dark:text-white font-medium flex items-center gap-2">
                    {entry.success ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}
                    Build #{entry.fromBuild} → #{entry.toBuild}
                  </p>
                  <p className="text-light-text-muted dark:text-gray-400 text-sm">
                    {new Date(entry.updatedAt).toLocaleString()} by {entry.updatedBy}
                    {entry.backupCreated && ' (backup created)'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h3 className="text-xl font-bold text-light-text-primary dark:text-white mb-4">Schedule Update</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-light-text-secondary dark:text-gray-300 mb-2">Select Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-2 bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-white rounded-lg border border-light-border dark:border-dark-border focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-light-text-secondary dark:text-gray-400 hover:text-light-text-primary dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleUpdate}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Schedule
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ===== Backups Tab =====
function BackupsTab() {
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [schedules, setSchedules] = useState<AutoBackupSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [createOptions, setCreateOptions] = useState({
    includesWorlds: true,
    includesPlugins: true,
    includesConfigs: true,
  });
  const [scheduleForm, setScheduleForm] = useState<Partial<AutoBackupSchedule>>({
    enabled: true,
    scheduleType: 'daily',
    intervalValue: 24,
    includesWorlds: true,
    includesPlugins: true,
    includesConfigs: true,
    retentionType: 'keep-last',
    retentionValue: 7,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [backupsRes, schedulesRes] = await Promise.all([
        client.get('/backups'),
        client.get('/backups/schedules'),
      ]);
      setBackups(backupsRes.data || []);
      setSchedules(schedulesRes.data || []);
    } catch (err) {
      console.error('Error fetching backup data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!createOptions.includesWorlds && !createOptions.includesPlugins && !createOptions.includesConfigs) {
      toast.warning('Please select at least one content type to backup');
      return;
    }
    setActionLoading('create');
    try {
      await client.post('/backups/create', createOptions);
      toast.success('Backup created successfully!');
      setShowCreateModal(false);
      fetchData(); // Refresh immediately
    } catch (err: any) {
      toast.error('Failed to create backup: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadBackup = async (id: number, filename: string) => {
    try {
      const response = await client.get(`/backups/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (err: any) {
      toast.error('Failed to download backup: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteBackup = async (id: number) => {
    if (!confirm('Are you sure you want to delete this backup? This cannot be undone.')) return;
    try {
      await client.delete(`/backups/${id}`);
      toast.success('Backup deleted');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to delete backup: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSaveSchedule = async () => {
    try {
      await client.post('/backups/schedules', scheduleForm);
      toast.success('Schedule saved successfully!');
      setShowScheduleModal(false);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to save schedule: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('Delete this auto-backup schedule?')) return;
    try {
      await client.delete(`/backups/schedules/${id}`);
      toast.success('Schedule deleted');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to delete schedule: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-light-text-primary dark:text-dark-text-primary">Loading backup information...</Card>;
  }

  return (
    <div className="space-y-6">
      {/* Manual Backup Section */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2 flex items-center gap-2">
              <Archive className="w-5 h-5 text-blue-500" />
              Create Backup
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              Create a manual backup of your server data
            </p>
          </div>
          <PermissionTooltip permission={Permission.CREATE_BACKUP}>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-2 font-medium"
            >
              <Archive className="w-4 h-4" />
              Create Backup
            </button>
          </PermissionTooltip>
        </div>
      </Card>

      {/* Auto-Backup Schedules */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-500" />
            Auto-Backup Schedules
          </h2>
          <PermissionTooltip permission={Permission.MANAGE_AUTO_BACKUP}>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 text-sm"
            >
              <Settings className="w-3 h-3" />
              Add Schedule
            </button>
          </PermissionTooltip>
        </div>
        {schedules.length === 0 ? (
          <p className="text-light-text-muted dark:text-dark-text-muted text-center py-4">No auto-backup schedules configured</p>
        ) : (
          <div className="space-y-2">
            {schedules.map(schedule => (
              <div key={schedule.id} className="flex items-center justify-between p-3 bg-light-surface dark:bg-dark-surface rounded-lg">
                <div>
                  <p className="text-light-text-primary dark:text-white font-medium flex items-center gap-2">
                    {schedule.enabled ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-gray-500" />}
                    {schedule.scheduleType === 'daily' ? 'Daily' :
                     schedule.scheduleType === 'every-6-hours' ? 'Every 6 Hours' :
                     schedule.scheduleType === 'weekly' ? 'Weekly' : `Every ${schedule.intervalValue}h`}
                  </p>
                  <p className="text-light-text-muted dark:text-gray-400 text-sm">
                    {schedule.includesWorlds && 'Worlds '}{schedule.includesPlugins && 'Plugins '}{schedule.includesConfigs && 'Configs'}
                    {schedule.retentionType && ` | Keep ${schedule.retentionValue} ${schedule.retentionType === 'keep-last' ? 'backups' : 'days'}`}
                  </p>
                  {schedule.nextRun && (
                    <p className="text-light-text-muted dark:text-gray-400 text-xs">
                      Next run: {new Date(schedule.nextRun).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteSchedule(schedule.id)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Backup List */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-green-500" />
            Available Backups ({backups.length})
          </h2>
          <button
            onClick={fetchData}
            className="p-2 text-light-text-secondary dark:text-gray-400 hover:text-light-text-primary dark:hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {backups.length === 0 ? (
          <p className="text-light-text-muted dark:text-dark-text-muted text-center py-4">No backups available</p>
        ) : (
          <div className="space-y-2">
            {backups.map(backup => (
              <div key={backup.id} className="flex items-center justify-between p-3 bg-light-surface dark:bg-dark-surface rounded-lg">
                <div className="flex-1">
                  <p className="text-light-text-primary dark:text-white font-medium">{backup.filename}</p>
                  <p className="text-light-text-muted dark:text-gray-400 text-sm">
                    {backup.sizeMB.toFixed(2)} MB | {new Date(backup.createdAt).toLocaleString()} | {backup.backupType}
                  </p>
                  <p className="text-light-text-muted dark:text-gray-400 text-xs">
                    {backup.includesWorlds && 'Worlds '}{backup.includesPlugins && 'Plugins '}{backup.includesConfigs && 'Configs'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <PermissionTooltip permission={Permission.DOWNLOAD_BACKUP}>
                    <button
                      onClick={() => handleDownloadBackup(backup.id, backup.filename)}
                      className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </PermissionTooltip>
                  <PermissionTooltip permission={Permission.DELETE_BACKUP}>
                    <button
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </PermissionTooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h3 className="text-xl font-bold text-light-text-primary dark:text-white mb-4">Create Backup</h3>
            <div className="space-y-4">
              <p className="text-light-text-secondary dark:text-gray-300">Select what to include in the backup:</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createOptions.includesWorlds}
                  onChange={(e) => setCreateOptions(prev => ({ ...prev, includesWorlds: e.target.checked }))}
                  className="w-5 h-5 rounded border-light-border dark:border-dark-border text-primary-500 focus:ring-primary-500"
                />
                <span className="text-light-text-primary dark:text-white">Worlds (world, world_nether, world_the_end)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createOptions.includesPlugins}
                  onChange={(e) => setCreateOptions(prev => ({ ...prev, includesPlugins: e.target.checked }))}
                  className="w-5 h-5 rounded border-light-border dark:border-dark-border text-primary-500 focus:ring-primary-500"
                />
                <span className="text-light-text-primary dark:text-white">Plugins (plugins folder)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createOptions.includesConfigs}
                  onChange={(e) => setCreateOptions(prev => ({ ...prev, includesConfigs: e.target.checked }))}
                  className="w-5 h-5 rounded border-light-border dark:border-dark-border text-primary-500 focus:ring-primary-500"
                />
                <span className="text-light-text-primary dark:text-white">Configs (server.properties, yml files, etc.)</span>
              </label>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-light-text-secondary dark:text-gray-400 hover:text-light-text-primary dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBackup}
                  disabled={actionLoading === 'create'}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  {actionLoading === 'create' ? 'Creating...' : 'Create Backup'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h3 className="text-xl font-bold text-light-text-primary dark:text-white mb-4">Auto-Backup Schedule</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleForm.enabled}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-5 h-5 rounded border-light-border dark:border-dark-border text-primary-500 focus:ring-primary-500"
                />
                <span className="text-light-text-primary dark:text-white">Enabled</span>
              </label>

              <div>
                <label className="block text-light-text-secondary dark:text-gray-300 mb-2">Schedule Type</label>
                <select
                  value={scheduleForm.scheduleType}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduleType: e.target.value as any }))}
                  className="w-full px-4 py-2 bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-white rounded-lg border border-light-border dark:border-dark-border focus:border-primary-500 focus:outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="every-6-hours">Every 6 Hours</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {scheduleForm.scheduleType === 'custom' && (
                <div>
                  <label className="block text-light-text-secondary dark:text-gray-300 mb-2">Interval (hours)</label>
                  <input
                    type="number"
                    value={scheduleForm.intervalValue}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, intervalValue: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-white rounded-lg border border-light-border dark:border-dark-border focus:border-primary-500 focus:outline-none"
                    min="1"
                  />
                </div>
              )}

              <div>
                <label className="block text-light-text-secondary dark:text-gray-300 mb-2">Include</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.includesWorlds}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, includesWorlds: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-light-text-primary dark:text-white text-sm">Worlds</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.includesPlugins}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, includesPlugins: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-light-text-primary dark:text-white text-sm">Plugins</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.includesConfigs}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, includesConfigs: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-light-text-primary dark:text-white text-sm">Configs</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-light-text-secondary dark:text-gray-300 mb-2">Retention Policy</label>
                <div className="flex gap-2">
                  <select
                    value={scheduleForm.retentionType}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, retentionType: e.target.value as any }))}
                    className="flex-1 px-4 py-2 bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-white rounded-lg border border-light-border dark:border-dark-border focus:border-primary-500 focus:outline-none"
                  >
                    <option value="keep-last">Keep last N backups</option>
                    <option value="delete-older">Delete older than N days</option>
                  </select>
                  <input
                    type="number"
                    value={scheduleForm.retentionValue}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, retentionValue: parseInt(e.target.value) }))}
                    className="w-20 px-4 py-2 bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-white rounded-lg border border-light-border dark:border-dark-border focus:border-primary-500 focus:outline-none"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-light-text-secondary dark:text-gray-400 hover:text-light-text-primary dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSchedule}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Save Schedule
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
