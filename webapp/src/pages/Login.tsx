import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import logoBlack from '../img/pp_logo_black.png';
import logoWhite from '../img/pp_logo_white.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-bg via-light-surface to-light-card dark:from-dark-bg dark:via-dark-surface dark:to-dark-card flex items-center justify-center p-4">
      <div className="bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-xl p-8 rounded-3xl shadow-strong dark:shadow-dark-strong w-full max-w-md border border-light-border/50 dark:border-dark-border/50">
        <div className="flex flex-col items-center justify-center mb-8">
          <img
            src={theme === 'dark' ? logoWhite : logoBlack}
            alt="PaperPanel Logo"
            className="w-32 h-32 sm:w-40 sm:h-40 object-contain mb-4"
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">PaperPanel</h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">Server Management</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-light-card dark:bg-dark-card text-light-text-primary dark:text-dark-text-primary rounded-xl border border-light-border dark:border-dark-border focus:border-primary-500 focus:outline-none transition-colors shadow-soft dark:shadow-dark-soft"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-light-card dark:bg-dark-card text-light-text-primary dark:text-dark-text-primary rounded-xl border border-light-border dark:border-dark-border focus:border-primary-500 focus:outline-none transition-colors shadow-soft dark:shadow-dark-soft"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-light-text-muted dark:text-dark-text-muted">
          <p>Default credentials:</p>
          <p className="mt-1 font-mono text-light-text-secondary dark:text-dark-text-secondary">admin / changeme</p>
          <p className="mt-3 text-yellow-600 dark:text-yellow-500">⚠️ Please change default password after first login</p>
        </div>
      </div>
    </div>
  );
}
