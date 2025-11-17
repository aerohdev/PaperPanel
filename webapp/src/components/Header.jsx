import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      window.location.href = '/login';
    }
  };

  return (
    <header className="bg-dark-surface border-b border-dark-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Welcome back, {user?.username || 'Admin'}
          </h2>
          <p className="text-sm text-gray-400">Manage your Minecraft server</p>
        </div>

        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="flex items-center gap-2 px-4 py-2 bg-dark-bg rounded-lg">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">{user?.username || 'Admin'}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
