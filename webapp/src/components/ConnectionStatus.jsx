export default function ConnectionStatus({ connected, reconnecting, connectionError, onReconnect }) {
  if (connected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 border border-green-600 rounded text-green-400 text-sm">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span>Connected</span>
      </div>
    );
  }

  if (reconnecting) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-600/20 border border-yellow-600 rounded text-yellow-400 text-sm">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
        <span>Reconnecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-600 rounded text-red-400 text-sm">
        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
        <span>Disconnected</span>
      </div>

      {connectionError && (
        <span className="text-xs text-gray-400">({connectionError})</span>
      )}

      <button
        onClick={onReconnect}
        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition"
      >
        Retry Now
      </button>
    </div>
  );
}
