import { useState, ChangeEvent } from 'react';
import client from '../api/client';
import { Radio, Type, MessageSquare, Volume2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { ScrollAnimatedItem } from '../components/ScrollAnimatedItem';

interface BroadcastMessageRequest {
  message: string;
  color?: string;
}

interface TitleRequest {
  title: string;
  subtitle?: string;
  fadeIn: number;
  stay: number;
  fadeOut: number;
}

interface ActionBarRequest {
  message: string;
}

interface SoundRequest {
  sound: string;
  volume: number;
  pitch: number;
}

export default function Broadcast() {
  const { toast } = useToast();
  const [message, setMessage] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [subtitle, setSubtitle] = useState<string>('');
  const [actionBarText, setActionBarText] = useState<string>('');
  const [selectedSound, setSelectedSound] = useState<string>('ENTITY_PLAYER_LEVELUP');
  const [sending, setSending] = useState<boolean>(false);

  const sendChatMessage = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      await client.post<BroadcastMessageRequest>('/broadcast/message', {
        message: message.trim(),
        color: '#FFFFFF'
      });
      toast.success('Message sent to all players!');
      setMessage('');
    } catch (error: any) {
      toast.error('Failed to send message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const sendTitle = async () => {
    if (!title.trim()) return;

    setSending(true);
    try {
      await client.post<TitleRequest>('/broadcast/title', {
        title: title.trim(),
        subtitle: subtitle.trim(),
        fadeIn: 1,
        stay: 3,
        fadeOut: 1
      });
      toast.success('Title sent to all players!');
      setTitle('');
      setSubtitle('');
    } catch (error: any) {
      toast.error('Failed to send title: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const sendActionBar = async () => {
    if (!actionBarText.trim()) return;

    setSending(true);
    try {
      await client.post<ActionBarRequest>('/broadcast/actionbar', {
        message: actionBarText.trim()
      });
      toast.success('Action bar sent to all players!');
      setActionBarText('');
    } catch (error: any) {
      toast.error('Failed to send action bar: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const playSound = async () => {
    setSending(true);
    try {
      await client.post<SoundRequest>('/broadcast/sound', {
        sound: selectedSound,
        volume: 1.0,
        pitch: 1.0
      });
      toast.success('Sound played for all players!');
    } catch (error: any) {
      toast.error('Failed to play sound: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setSending(true);
    try {
      switch (action) {
        case 'restart':
          await client.post('/broadcast/title', {
            title: '⚠️ Server Restart ⚠️',
            subtitle: 'in 5 minutes',
            fadeIn: 1,
            stay: 3,
            fadeOut: 1
          });
          break;
        case 'welcome':
          await client.post('/broadcast/message', {
            message: '🎉 Welcome to the server!',
            color: '#FFFFFF'
          });
          break;
        case 'maintenance':
          await client.post('/broadcast/actionbar', {
            message: '⚡ Server maintenance in progress...'
          });
          break;
        case 'event':
          await client.post('/broadcast/title', {
            title: '🏆 Event Starting!',
            subtitle: 'Join now at spawn',
            fadeIn: 1,
            stay: 3,
            fadeOut: 1
          });
          await client.post('/broadcast/sound', {
            sound: 'UI_TOAST_CHALLENGE_COMPLETE',
            volume: 1.0,
            pitch: 1.0
          });
          break;
      }
      toast.success('Quick action executed successfully!');
    } catch (error: any) {
      toast.error('Failed to execute quick action: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <ScrollAnimatedItem delay={0}>
        <div>
          <div className="flex items-center gap-3">
            <Radio className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-white">Broadcast Messages</h1>
          </div>
          <p className="text-gray-400 mt-2">
            Send messages, titles, action bars, and sounds to all online players.
          </p>
        </div>
      </ScrollAnimatedItem>

      {/* Chat Message */}
      <ScrollAnimatedItem delay={0.1}>
        <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Chat Message</h3>
        </div>
        <p className="text-gray-300 text-sm mb-4">
          Send a message in chat to all online players
        </p>

        <div className="space-y-4">
          <textarea
            value={message}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            placeholder="Enter your message..."
            rows={3}
            className="w-full px-4 py-2 bg-gray-900/40 backdrop-blur-xl text-white rounded border border-white/20 focus:border-primary-500 focus:outline-none resize-none"
          />

          <button
            onClick={sendChatMessage}
            disabled={!message.trim() || sending}
            className="px-6 py-2 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-600/80 backdrop-blur-xl text-white rounded hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-blue-500/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.3)]"
          >
            {sending ? 'Sending...' : 'Send Chat Message'}
          </button>
        </div>
      </div>
      </ScrollAnimatedItem>

      {/* Title Message */}
      <ScrollAnimatedItem delay={0.2}>
        <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-purple-400" />
          <h3 className="text-xl font-bold text-white">Title Message</h3>
        </div>
        <p className="text-gray-300 text-sm mb-4">
          Display a large title in the center of all players' screens
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Main title (large text)"
            className="w-full px-4 py-2 bg-gray-900/40 backdrop-blur-xl text-white rounded border border-white/20 focus:border-primary-500 focus:outline-none"
          />

          <input
            type="text"
            value={subtitle}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSubtitle(e.target.value)}
            placeholder="Subtitle (smaller text below)"
            className="w-full px-4 py-2 bg-gray-900/40 backdrop-blur-xl text-white rounded border border-white/20 focus:border-primary-500 focus:outline-none"
          />

          <button
            onClick={sendTitle}
            disabled={!title.trim() || sending}
            className="px-6 py-2 bg-gradient-to-br from-purple-600/80 via-purple-700/80 to-purple-600/80 backdrop-blur-xl text-white rounded hover:from-purple-600 hover:via-purple-700 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-purple-500/50 shadow-[0_4px_16px_0_rgba(168,85,247,0.3)]"
          >
            {sending ? 'Sending...' : 'Send Title'}
          </button>
        </div>
      </div>
      </ScrollAnimatedItem>

      {/* Action Bar */}
      <ScrollAnimatedItem delay={0.3}>
        <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-green-400" />
          <h3 className="text-xl font-bold text-white">Action Bar</h3>
        </div>
        <p className="text-gray-300 text-sm mb-4">
          Display a message above the hotbar for all players
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={actionBarText}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setActionBarText(e.target.value)}
            placeholder="Action bar message"
            className="w-full px-4 py-2 bg-gray-900/40 backdrop-blur-xl text-white rounded border border-white/20 focus:border-primary-500 focus:outline-none"
          />

          <button
            onClick={sendActionBar}
            disabled={!actionBarText.trim() || sending}
            className="px-6 py-2 bg-gradient-to-br from-green-600/80 via-green-700/80 to-green-600/80 backdrop-blur-xl text-white rounded hover:from-green-600 hover:via-green-700 hover:to-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-green-500/50 shadow-[0_4px_16px_0_rgba(34,197,94,0.3)]"
          >
            {sending ? 'Sending...' : 'Send Action Bar'}
          </button>
        </div>
      </div>
      </ScrollAnimatedItem>

      {/* Sound */}
      <ScrollAnimatedItem delay={0.4}>
        <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">Play Sound</h3>
        </div>
        <p className="text-gray-300 text-sm mb-4">
          Play a sound effect for all online players
        </p>

        <div className="space-y-4">
          <select
            value={selectedSound}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedSound(e.target.value)}
            className="w-full px-4 py-3 bg-black/30 backdrop-blur-xl text-white placeholder-gray-500 rounded-xl border border-white/30 focus:border-primary-500 focus:outline-none transition-colors [&>option]:bg-gray-900 [&>option]:text-white"
          >
            <option value="ENTITY_PLAYER_LEVELUP">Level Up</option>
            <option value="ENTITY_EXPERIENCE_ORB_PICKUP">XP Pickup</option>
            <option value="BLOCK_NOTE_BLOCK_PLING">Pling</option>
            <option value="ENTITY_VILLAGER_YES">Villager Yes</option>
            <option value="ENTITY_VILLAGER_NO">Villager No</option>
            <option value="BLOCK_ANVIL_LAND">Anvil</option>
            <option value="ENTITY_ENDER_DRAGON_GROWL">Dragon</option>
            <option value="UI_TOAST_CHALLENGE_COMPLETE">Achievement</option>
          </select>

          <button
            onClick={playSound}
            disabled={sending}
            className="px-6 py-2 bg-gradient-to-br from-yellow-600/80 via-yellow-700/80 to-yellow-600/80 backdrop-blur-xl text-white rounded hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-yellow-500/50 shadow-[0_4px_16px_0_rgba(234,179,8,0.3)]"
          >
            {sending ? 'Playing...' : 'Play Sound'}
          </button>
        </div>
      </div>
      </ScrollAnimatedItem>

      {/* Quick Actions */}
      <ScrollAnimatedItem delay={0.5}>
        <div className="bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4 text-white">Quick Actions</h3>
        <p className="text-gray-300 text-sm mb-4">
          Pre-configured announcements for common scenarios
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => handleQuickAction('restart')}
            disabled={sending}
            className="px-4 py-3 bg-gradient-to-br from-red-600/80 via-red-700/80 to-red-600/80 backdrop-blur-xl text-white rounded hover:from-red-600 hover:via-red-700 hover:to-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-left border border-red-500/50 shadow-[0_4px_16px_0_rgba(239,68,68,0.3)]"
          >
            <div className="font-bold">⚠️ Server Restart Warning</div>
            <div className="text-sm text-red-200">Announce restart in 5 minutes</div>
          </button>

          <button
            onClick={() => handleQuickAction('welcome')}
            disabled={sending}
            className="px-4 py-3 bg-gradient-to-br from-green-600/80 via-green-700/80 to-green-600/80 backdrop-blur-xl text-white rounded hover:from-green-600 hover:via-green-700 hover:to-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-left border border-green-500/50 shadow-[0_4px_16px_0_rgba(34,197,94,0.3)]"
          >
            <div className="font-bold">🎉 Welcome Message</div>
            <div className="text-sm text-green-200">Greet all players</div>
          </button>

          <button
            onClick={() => handleQuickAction('maintenance')}
            disabled={sending}
            className="px-4 py-3 bg-gradient-to-br from-yellow-600/80 via-yellow-700/80 to-yellow-600/80 backdrop-blur-xl text-white rounded hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-left border border-yellow-500/50 shadow-[0_4px_16px_0_rgba(234,179,8,0.3)]"
          >
            <div className="font-bold">⚡ Maintenance Notice</div>
            <div className="text-sm text-yellow-200">Action bar notification</div>
          </button>

          <button
            onClick={() => handleQuickAction('event')}
            disabled={sending}
            className="px-4 py-3 bg-gradient-to-br from-purple-600/80 via-purple-700/80 to-purple-600/80 backdrop-blur-xl text-white rounded hover:from-purple-600 hover:via-purple-700 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-left border border-purple-500/50 shadow-[0_4px_16px_0_rgba(168,85,247,0.3)]"
          >
            <div className="font-bold">🏆 Event Announcement</div>
            <div className="text-sm text-purple-200">Title + sound effect</div>
          </button>
        </div>
      </div>
      </ScrollAnimatedItem>
    </div>
  );
}
