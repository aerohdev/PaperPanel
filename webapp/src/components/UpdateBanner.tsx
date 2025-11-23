import { useState, useEffect } from 'react';
import { Download, AlertCircle, CheckCircle, RefreshCw, X, AlertTriangle } from 'lucide-react';
import client from '../api/client';

interface UpdateStatus {
  updateAvailable: boolean;
  updateDownloaded: boolean;
  currentVersion: string;
  latestVersion: string;
  latestBuild: string;
  downloadUrl: string;
  lastCheck: number;
  needsCheck: boolean;
}

export default function UpdateBanner() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showInstallConfirm, setShowInstallConfirm] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    checkUpdateStatus();
    // Check every 10 minutes
    const interval = setInterval(checkUpdateStatus, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!isInstalling) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isInstalling]);

  const checkUpdateStatus = async () => {
    try {
      const response = await client.get('/dashboard/update-status');
      // Response is already unwrapped by interceptor
      setUpdateStatus(response.data);
      setShowBanner(response.data.updateAvailable);
    } catch (err) {
      console.error('Failed to check update status:', err);
    }
  };

  const handleCheckUpdates = async () => {
    setLoading(true);
    try {
      await client.post('/dashboard/check-updates');
      // Wait a bit for the check to complete
      setTimeout(() => {
        checkUpdateStatus();
        setLoading(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to check updates:', err);
      setLoading(false);
    }
  };

  const handleDownloadUpdate = async () => {
    setLoading(true);
    try {
      await client.post('/dashboard/download-update');
      // Poll for download completion
      const pollInterval = setInterval(async () => {
        const status = await client.get('/dashboard/update-status');
        if (status.data.updateDownloaded) {
          clearInterval(pollInterval);
          setUpdateStatus(status.data);
          setLoading(false);
          setShowInstallConfirm(true);
        }
      }, 5000);
      
      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
    } catch (err) {
      alert('Failed to download update: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  const handleInstallUpdate = async () => {
    setShowInstallConfirm(true);
  };

  const confirmInstall = async () => {
    setLoading(true);
    try {
      await client.post('/dashboard/install-update');
      setShowInstallConfirm(false);
      setIsInstalling(true);
      setTimeRemaining(300); // Reset to 5 minutes
      setLoading(false);
    } catch (err) {
      alert('Failed to install update: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  if (!showBanner || dismissed || !updateStatus) {
    return null;
  }

  // Format time remaining as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Installation Timer Banner */}
      {isInstalling && (
        <div className="bg-gradient-to-r from-orange-600 to-red-600 border-b border-orange-700 px-6 py-4">
          <div className="flex items-center justify-center max-w-7xl mx-auto gap-4">
            <AlertTriangle className="w-6 h-6 text-white flex-shrink-0 animate-pulse" />
            <div className="text-center">
              <p className="text-white font-bold text-lg">
                🔄 Server Restart in Progress
              </p>
              <p className="text-orange-100 text-sm">
                Server will restart in <span className="font-mono font-bold text-white text-base">{formatTime(timeRemaining)}</span>
              </p>
            </div>
            <RefreshCw className="w-6 h-6 text-white flex-shrink-0 animate-spin" />
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {!isInstalling && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-blue-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4 flex-1">
            {updateStatus.updateDownloaded ? (
              <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0" />
            ) : (
              <Download className="w-6 h-6 text-white flex-shrink-0" />
            )}
            
            <div className="flex-1">
              <p className="text-white font-semibold">
                {updateStatus.updateDownloaded 
                  ? '🎉 Update Ready to Install!' 
                  : '🚀 New Paper Version Available!'}
              </p>
              <p className="text-blue-100 text-sm">
                {updateStatus.updateDownloaded
                  ? `Paper ${updateStatus.latestVersion} (Build ${updateStatus.latestBuild}) is downloaded and ready to install.`
                  : `Paper ${updateStatus.latestVersion} (Build ${updateStatus.latestBuild}) is available. Current: ${updateStatus.currentVersion}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {updateStatus.updateDownloaded ? (
              <button
                onClick={handleInstallUpdate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? 'Installing...' : 'Install Now'}
              </button>
            ) : (
              <button
                onClick={handleDownloadUpdate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed text-blue-600 rounded-lg transition-colors font-medium"
              >
                <Download className={`w-4 h-4 ${loading ? 'animate-bounce' : ''}`} />
                {loading ? 'Downloading...' : 'Download Update'}
              </button>
            )}
            
            <button
              onClick={() => setDismissed(true)}
              className="text-white hover:text-blue-100 transition-colors"
              title="Dismiss (will reappear on refresh)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Install Confirmation Modal */}
      {showInstallConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-surface p-6 rounded-lg shadow-xl max-w-md border border-dark-border">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-bold text-white">Confirm Installation</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              The server will restart in 5 minutes to complete the installation. 
              All players will be kicked with a warning message. Are you sure you want to proceed?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={confirmInstall}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                {loading ? 'Installing...' : 'Yes, Install Now'}
              </button>
              <button
                onClick={() => setShowInstallConfirm(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
