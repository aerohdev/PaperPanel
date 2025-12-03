import { useState, useEffect, useRef, FormEvent, KeyboardEvent, ChangeEvent } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import ConnectionStatus from '../components/ConnectionStatus';
import { Terminal, Send, Trash2 } from 'lucide-react';
import type { WebSocketMessage } from '../hooks/useWebSocket';
import { Card } from '../components/Card';
import { ScrollAnimatedItem } from '../components/ScrollAnimatedItem';

export default function Console() {
  const {
    messages,
    send,
    connected,
    reconnecting,
    connectionError,
    reconnect,
    clearMessages
  } = useWebSocket(`ws://${window.location.host}/ws/console`);
  const [command, setCommand] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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

  const getLogColor = (message: WebSocketMessage): string => {
    const text = message.message || '';
    if (text.includes('[ERROR]') || text.includes('ERROR')) return 'text-red-400';
    if (text.includes('[WARN]') || text.includes('WARN')) return 'text-yellow-400';
    if (text.includes('[INFO]') || text.includes('INFO')) return 'text-green-400';
    return 'text-gray-300';
  };

  return (
    <div className="flex flex-col h-full p-6">
      <ScrollAnimatedItem delay={0}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mr-3">
              <Terminal className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Live Console</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900/40 backdrop-blur-xl hover:bg-white/10 text-white rounded-xl transition-colors border border-white/20 shadow-[0_4px_16px_0_rgba(0,0,0,0.4),0_0_30px_0_rgba(138,92,246,0.1)]"
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
      </ScrollAnimatedItem>

      {/* Console Output */}
      <ScrollAnimatedItem delay={0.1} className="flex-1 min-h-0 flex flex-col">
        <div
          ref={logRef}
          className="flex-1 bg-black p-4 rounded-lg font-mono text-sm overflow-y-auto border border-white/20"
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
      </ScrollAnimatedItem>

      {/* Command Input */}
      <ScrollAnimatedItem delay={0.2}>
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400 font-mono">
            &gt;
          </span>
          <input
            type="text"
            value={command}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command... (Use ↑ ↓ for history)"
            className="w-full pl-10 pr-4 py-3 bg-gray-900/40 backdrop-blur-xl text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none font-mono"
            disabled={!connected}
          />
        </div>
        <button
          type="submit"
          disabled={!connected || !command.trim()}
          className="px-6 py-3 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded-lg hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3),0_0_30px_0_rgba(37,99,235,0.2)]"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
        </form>

        {/* Help Text */}
        <div className="mt-2 text-xs text-gray-500">
          <p>Tip: Use arrow keys (↑ ↓) to navigate command history</p>
        </div>
      </ScrollAnimatedItem>
    </div>
  );
}
