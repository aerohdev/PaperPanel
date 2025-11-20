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
      if (response.data.success && response.data.usingDefaultPassword) {
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
    <div className="bg-red-600 border-b border-red-700 px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" />
          <div>
            <p className="text-white font-semibold">
              Security Warning: Default Password Detected
            </p>
            <p className="text-red-100 text-sm">
              You are using the default password. Please change it immediately in{' '}
              <a href="/users" className="underline hover:text-white">
                User Management
              </a>
              {' '}to secure your server.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-white hover:text-red-100 transition-colors ml-4"
          title="Dismiss (will reappear on refresh)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}