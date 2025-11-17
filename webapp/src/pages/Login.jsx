import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Server, Lock, User } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="bg-dark-surface p-8 rounded-lg shadow-2xl w-full max-w-md border border-dark-border">
        <div className="flex items-center justify-center mb-8">
          <Server className="w-12 h-12 text-blue-500 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 text-sm">Server Management</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-dark-bg text-white rounded-lg border border-dark-border focus:border-blue-500 focus:outline-none transition-colors"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-dark-bg text-white rounded-lg border border-dark-border focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Default credentials: admin / changeme</p>
        </div>
      </div>
    </div>
  );
}
