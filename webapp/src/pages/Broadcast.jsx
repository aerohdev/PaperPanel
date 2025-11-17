import { useState } from 'react';
import client from '../api/client';
import { Radio, Type, MessageSquare, Volume2 } from 'lucide-react';

export default function Broadcast() {
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [actionBarText, setActionBarText] = useState('');
  const [selectedSound, setSelectedSound] = useState('ENTITY_PLAYER_LEVELUP');
  const [sending, setSending] = useState(false);

  const sendChatMessage = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      await client.post('/broadcast/message', {
        message: message.trim(),
        color: '#FFFFFF'
      });
      alert('Message sent to all players!');
      setMessage('');
    } catch (error) {
      alert('Failed to send message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const sendTitle = async () => {
    if (!title.trim()) return;

    setSending(true);
    try {
      await client.post('/broadcast/title', {
        title: title.trim(),
        subtitle: subtitle.trim(),
        fadeIn: 1,
        stay: 3,
        fadeOut: 1
      });
      alert('Title sent to all players!');
      setTitle('');
      setSubtitle('');
    } catch (error) {
      alert('Failed to send title: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const sendActionBar = async () => {
    if (!actionBarText.trim()) return;

    setSending(true);
    try {
      await client.post('/broadcast/actionbar', {
        message: actionBarText.trim()
      });
      alert('Action bar sent to all players!');
      setActionBarText('');
    } catch (error) {
      alert('Failed to send action bar: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const playSound = async () => {
    setSending(true);
    try {
      await client.post('/broadcast/sound', {
        sound: selectedSound,
        volume: 1.0,
        pitch: 1.0
      });
      alert('Sound played for all players!');
    } catch (error) {
      alert('Failed to play sound: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleQuickAction = async (action) => {
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
      alert('Quick action executed successfully!');
    } catch (error) {
      alert('Failed to execute quick action: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Radio className="w-8 h-8 text-blue-500" />
        <h1 className="text-3xl font-bold text-white">Broadcast Messages</h1>
      </div>

      <p className="text-gray-400">
        Send messages, titles, action bars, and sounds to all online players.
      </p>

      {/* Chat Message */}
      <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Chat Message</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Send a message in chat to all online players
        </p>

        <div className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message..."
            rows={3}
            className="w-full px-4 py-2 bg-dark-bg text-white rounded border border-dark-border focus:border-blue-500 focus:outline-none resize-none"
          />

          <button
            onClick={sendChatMessage}
            disabled={!message.trim() || sending}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {sending ? 'Sending...' : 'Send Chat Message'}
          </button>
        </div>
      </div>

      {/* Title Message */}
      <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-purple-400" />
          <h3 className="text-xl font-bold text-white">Title Message</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Display a large title in the center of all players' screens
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Main title (large text)"
            className="w-full px-4 py-2 bg-dark-bg text-white rounded border border-dark-border focus:border-purple-500 focus:outline-none"
          />

          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Subtitle (smaller text below)"
            className="w-full px-4 py-2 bg-dark-bg text-white rounded border border-dark-border focus:border-purple-500 focus:outline-none"
          />

          <button
            onClick={sendTitle}
            disabled={!title.trim() || sending}
            className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {sending ? 'Sending...' : 'Send Title'}
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-green-400" />
          <h3 className="text-xl font-bold text-white">Action Bar</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Display a message above the hotbar for all players
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={actionBarText}
            onChange={(e) => setActionBarText(e.target.value)}
            placeholder="Action bar message"
            className="w-full px-4 py-2 bg-dark-bg text-white rounded border border-dark-border focus:border-green-500 focus:outline-none"
          />

          <button
            onClick={sendActionBar}
            disabled={!actionBarText.trim() || sending}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {sending ? 'Sending...' : 'Send Action Bar'}
          </button>
        </div>
      </div>

      {/* Sound */}
      <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">Play Sound</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Play a sound effect for all online players
        </p>

        <div className="space-y-4">
          <select
            value={selectedSound}
            onChange={(e) => setSelectedSound(e.target.value)}
            className="w-full px-4 py-2 bg-dark-bg text-white rounded border border-dark-border focus:border-yellow-500 focus:outline-none"
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
            className="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {sending ? 'Playing...' : 'Play Sound'}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
        <h3 className="text-xl font-bold mb-4 text-white">Quick Actions</h3>
        <p className="text-gray-400 text-sm mb-4">
          Pre-configured announcements for common scenarios
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => handleQuickAction('restart')}
            disabled={sending}
            className="px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-left"
          >
            <div className="font-bold">⚠️ Server Restart Warning</div>
            <div className="text-sm text-red-200">Announce restart in 5 minutes</div>
          </button>

          <button
            onClick={() => handleQuickAction('welcome')}
            disabled={sending}
            className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-left"
          >
            <div className="font-bold">🎉 Welcome Message</div>
            <div className="text-sm text-green-200">Greet all players</div>
          </button>

          <button
            onClick={() => handleQuickAction('maintenance')}
            disabled={sending}
            className="px-4 py-3 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-left"
          >
            <div className="font-bold">⚡ Maintenance Notice</div>
            <div className="text-sm text-yellow-200">Action bar notification</div>
          </button>

          <button
            onClick={() => handleQuickAction('event')}
            disabled={sending}
            className="px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-left"
          >
            <div className="font-bold">🏆 Event Announcement</div>
            <div className="text-sm text-purple-200">Title + sound effect</div>
          </button>
        </div>
      </div>
    </div>
  );
}
