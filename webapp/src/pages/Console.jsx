import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import ConnectionStatus from '../components/ConnectionStatus';
import { Terminal, Send, Trash2 } from 'lucide-react';

export default function Console() {
  const {
    messages,
    send,
    connected,
    reconnecting,
    connectionError,
    reconnect,
    clearMessages
  } = useWebSocket('ws://localhost:8080/ws/console');
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const logRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    send({
      type: 'command',
      command: command.trim()
    });

    setCommandHistory(prev => [...prev, command]);
    setCommand('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e) => {
    // Arrow up - previous command
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    }
    // Arrow down - next command
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  const handleClear = () => {
    clearMessages();
  };

  const getLogColor = (message) => {
    const text = message.message || '';
    if (text.includes('[ERROR]') || text.includes('ERROR')) return 'text-red-400';
    if (text.includes('[WARN]') || text.includes('WARN')) return 'text-yellow-400';
    if (text.includes('[INFO]') || text.includes('INFO')) return 'text-green-400';
    return 'text-gray-300';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Terminal className="w-6 h-6 text-white mr-2" />
          <h1 className="text-2xl font-bold text-white">Live Console</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 bg-dark-surface text-white rounded-lg hover:bg-dark-hover transition-colors border border-dark-border"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>

          <ConnectionStatus
            connected={connected}
            reconnecting={reconnecting}
            connectionError={connectionError}
            onReconnect={reconnect}
          />
        </div>
      </div>

      {/* Console Output */}
      <div
        ref={logRef}
        className="flex-1 bg-black p-4 rounded-lg font-mono text-sm overflow-y-auto border border-dark-border"
      >
        {messages.length === 0 ? (
          <div className="text-gray-500 italic">Waiting for console output...</div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`${getLogColor(msg)} leading-relaxed`}>
              {msg.type === 'log' && msg.message}
              {msg.type === 'connected' && (
                <span className="text-green-400">✓ {msg.message}</span>
              )}
              {msg.type === 'command_sent' && (
                <span className="text-blue-400">&gt; {msg.command}</span>
              )}
              {msg.type === 'error' && (
                <span className="text-red-400">✗ {msg.message}</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Command Input */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400 font-mono">
            &gt;
          </span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command... (Use ↑ ↓ for history)"
            className="w-full pl-10 pr-4 py-3 bg-dark-surface text-white rounded-lg border border-dark-border focus:border-blue-500 focus:outline-none font-mono"
            disabled={!connected}
          />
        </div>
        <button
          type="submit"
          disabled={!connected || !command.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>

      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500">
        <p>Tip: Use arrow keys (↑ ↓) to navigate command history</p>
      </div>
    </div>
  );
}
