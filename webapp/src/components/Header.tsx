import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="bg-dark-surface border-b border-dark-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">PaperPanel Admin</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-300">
            <User className="w-5 h-5" />
            <span>{user?.username}</span>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
