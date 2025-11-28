import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, RefreshCw, X, AlertTriangle, ChevronRight } from 'lucide-react';
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
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
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
      const response = await client.get('/updates/status');
      setUpdateStatus(response.data.updateStatus || response.data);
      setShowBanner(response.data.updateStatus?.updateAvailable || response.data.updateAvailable);
    } catch (err) {
      // Fallback to dashboard endpoint
      try {
        const response = await client.get('/dashboard/update-status');
        setUpdateStatus(response.data);
        setShowBanner(response.data.updateAvailable);
      } catch (e) {
        console.error('Failed to check update status:', e);
      }
    }
  };

  // Listen for installation events (this can be triggered from Updates page)
  useEffect(() => {
    const handleInstallEvent = () => {
      setIsInstalling(true);
      setTimeRemaining(300);
    };

    window.addEventListener('update-installing', handleInstallEvent);
    return () => window.removeEventListener('update-installing', handleInstallEvent);
  }, []);

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
        <div className="bg-red-600 border-b border-orange-700 px-6 py-4">
          <div className="flex items-center justify-center max-w-7xl mx-auto gap-4">
            <AlertTriangle className="w-6 h-6 text-white flex-shrink-0 animate-pulse" />
            <div className="text-center">
              <p className="text-white font-bold text-lg">
                Server Restart in Progress
              </p>
              <p className="text-orange-100 text-sm">
                Server will restart in <span className="font-mono font-bold text-white text-base">{formatTime(timeRemaining)}</span>
              </p>
            </div>
            <RefreshCw className="w-6 h-6 text-white flex-shrink-0 animate-spin" />
          </div>
        </div>
      )}

      {/* Update Available Banner - Now just a link to Updates page */}
      {!isInstalling && (
        <Link to="/updates" className="block">
          <div className="bg-blue-600 border-b border-blue-700 px-6 py-4 hover:bg-blue-700 transition-all cursor-pointer">
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
                      ? 'Update Ready to Install!'
                      : 'New Paper Version Available!'}
                  </p>
                  <p className="text-blue-100 text-sm">
                    {updateStatus.updateDownloaded
                      ? `Paper ${updateStatus.latestVersion} (Build ${updateStatus.latestBuild}) is downloaded and ready.`
                      : `Paper ${updateStatus.latestVersion} (Build ${updateStatus.latestBuild}) available. Click to manage updates.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-medium hidden sm:block">
                  Go to Updates
                </span>
                <ChevronRight className="w-5 h-5 text-white" />

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDismissed(true);
                  }}
                  className="text-white hover:text-blue-100 transition-colors ml-2"
                  title="Dismiss (will reappear on refresh)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </Link>
      )}
    </>
  );
}
