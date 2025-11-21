import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  connected: boolean;
  onReconnect?: () => void;
}

export default function ConnectionStatus({ connected, onReconnect }: ConnectionStatusProps) {
  if (connected) {
    return (
      <div className="flex items-center gap-2 text-green-500 text-sm">
        <Wifi className="w-4 h-4" />
        <span>Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-red-900/30 border border-red-500 text-red-200 px-4 py-2 rounded-lg">
      <WifiOff className="w-4 h-4" />
      <span>Disconnected</span>
      {onReconnect && (
        <button
          onClick={onReconnect}
          className="ml-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}
