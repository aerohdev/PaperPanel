import { useState, useEffect } from 'react';
import { Download, AlertCircle, CheckCircle, RefreshCw, X, AlertTriangle } from 'lucide-react';
import client from '../api/client';

export default function UpdateBanner() {
  const [updateStatus, setUpdateStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showInstallConfirm, setShowInstallConfirm] = useState(false);

  useEffect(() => {
    checkUpdateStatus();
    // Check every 10 minutes
    const interval = setInterval(checkUpdateStatus, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkUpdateStatus = async () => {
    try {
      const response = await client.get('/dashboard/update-status');
      if (response.data.success) {
        setUpdateStatus(response.data);
        setShowBanner(response.data.updateAvailable);
      }
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
      const response = await client.post('/dashboard/download-update');
      if (response.data.success) {
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
      }
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
      const response = await client.post('/dashboard/install-update');
      if (response.data.success) {
        alert('✅ Installation started!\n\nServer will restart in 5 minutes.\nPlease reconnect after restart.');
        setShowInstallConfirm(false);
        setShowBanner(false);
      }
    } catch (err) {
      alert('Failed to install update: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  if (!showBanner || dismissed || !updateStatus) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-blue-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4 flex-1">
            {updateStatus.updateDownloaded ? (
              <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-white flex-shrink-0 animate-pulse" />
            )}
            
            <div className="flex-1">
              <p className="text-white font-bold text-lg">
                {updateStatus.updateDownloaded 
                  ? '✅ Update Ready to Install!' 
                  : '🚀 Paper Server Update Available!'}
              </p>
              <p className="text-blue-100 text-sm">
                {updateStatus.updateDownloaded ? (
                  <>
                    New version downloaded: <strong>Build #{updateStatus.latestBuild}</strong>
                    {' • '}Click "Install Now" to complete the update
                  </>
                ) : (
                  <>
                    Current: <strong>{updateStatus.currentVersion}</strong>
                    {' → '}
                    Latest: <strong>Build #{updateStatus.latestBuild}</strong>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            {updateStatus.updateDownloaded ? (
              <button
                onClick={handleInstallUpdate}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold rounded-lg transition-colors shadow-lg"
              >
                <CheckCircle className="w-5 h-5" />
                {loading ? 'Installing...' : 'Install Now'}
              </button>
            ) : (
              <button
                onClick={handleDownloadUpdate}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-white hover:bg-gray-100 disabled:bg-gray-300 text-blue-600 font-semibold rounded-lg transition-colors shadow-lg"
              >
                <Download className="w-5 h-5" />
                {loading ? 'Downloading...' : 'Download Update'}
              </button>
            )}
            
            <button
              onClick={() => setDismissed(true)}
              className="text-white hover:text-blue-200 transition-colors p-1"
              title="Dismiss (will reappear on refresh)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Install Confirmation Modal */}
      {showInstallConfirm && (
        <InstallConfirmModal
          onClose={() => setShowInstallConfirm(false)}
          onInstall={confirmInstall}
          version={updateStatus.latestBuild}
          loading={loading}
        />
      )}
    </>
  );
}

// Install Confirmation Modal
function InstallConfirmModal({ onClose, onInstall, version, loading }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface border border-dark-border rounded-lg max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-white">Install Update?</h2>
          </div>
          <button 
            onClick={onClose} 
            disabled={installing}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500 rounded-lg">
            <p className="text-blue-400 font-medium mb-2">
              📦 Update Ready: Paper Build #{version}
            </p>
            <p className="text-gray-300 text-sm">
              The update has been downloaded successfully and is ready to install.
            </p>
          </div>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg">
            <p className="text-yellow-500 font-medium mb-3">⚠️ Installation Process:</p>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">1.</span>
                <span>Update announcement broadcasted to all players</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">2.</span>
                <span>5-minute countdown with regular warnings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">3.</span>
                <span>All players will be kicked</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">4.</span>
                <span>Full server backup created</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">5.</span>
                <span>Start script updated automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">6.</span>
                <span><strong>Server restarts with new version</strong></span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm font-medium">
              ⚠️ You will be disconnected from PaperPanel during restart.
              Please reconnect after the server is back online.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-6 border-t border-dark-border">
          <button
            onClick={onInstall}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Installing...' : 'Yes, Install Now'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-dark-hover hover:bg-dark-border text-white font-semibold rounded-lg transition-colors"
          >
            Not Yet
          </button>
        </div>
      </div>
    </div>
  );
}