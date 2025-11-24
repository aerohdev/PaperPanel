import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Server, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-xl p-8 rounded-3xl shadow-strong dark:shadow-dark-strong w-full max-w-md border border-light-border/50 dark:border-dark-border/50"
      >
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-purple/20 mr-3 shadow-glow">
            <Server className="w-12 h-12 text-primary-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-accent-purple bg-clip-text text-transparent">PaperPanel</h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">Server Management</p>
          </div>
        </motion.div>

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
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-gradient-to-r from-primary-500 to-accent-purple hover:from-primary-600 hover:to-accent-purple/90 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-xl transition-all disabled:cursor-not-allowed shadow-medium"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-xs text-light-text-muted dark:text-dark-text-muted"
        >
          <p>Default credentials:</p>
          <p className="mt-1 font-mono text-light-text-secondary dark:text-dark-text-secondary">admin / changeme</p>
          <p className="mt-3 text-yellow-600 dark:text-yellow-500">⚠️ Please change default password after first login</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
