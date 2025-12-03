import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import client from '../api/client';

export default function SecurityBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkSecurityStatus();
  }, []);

  const checkSecurityStatus = async () => {
    try {
      const response = await client.get('/auth/security-status');
      // Response is already unwrapped by interceptor
      if (response.data.usingDefaultPassword) {
        setShowBanner(true);
      }
    } catch (err) {
      console.error('Failed to check security status:', err);
    }
  };

  if (!showBanner || dismissed) {
    return null;
  }

  return (
    <div className="
      bg-gradient-to-r from-red-900/40 via-red-800/50 to-red-900/40
      backdrop-blur-xl backdrop-saturate-150
      border-b border-red-500/30
      px-6 py-3
      shadow-[0_4px_12px_0_rgba(220,38,38,0.3)]
    ">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-300 flex-shrink-0 drop-shadow-glow" />
          <div>
            <p className="text-white font-semibold drop-shadow-md">
              Security Warning: Default Password Detected
            </p>
            <p className="text-red-100 text-sm">
              You are using the default password. Please change it immediately in{' '}
              <a href="/users" className="underline hover:text-white transition-colors">
                User Management
              </a>
              {' '}to secure your server.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-white hover:text-red-100 hover:bg-white/10 rounded-lg p-1 transition-all ml-4"
          title="Dismiss (will reappear on refresh)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
