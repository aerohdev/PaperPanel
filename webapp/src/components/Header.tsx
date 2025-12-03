import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import logoBlack from '../img/pp_logo_black.png';
import logoWhite from '../img/pp_logo_white.png';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border px-6 py-4 shadow-soft dark:shadow-dark-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={theme === 'dark' ? logoWhite : logoBlack}
            alt="PaperPanel"
            className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
          />
          <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
            PaperPanel
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-900/40 backdrop-blur-xl hover:bg-white/10 text-white transition-colors border border-white/20 shadow-[0_4px_16px_0_rgba(0,0,0,0.4),0_0_30px_0_rgba(138,92,246,0.1)]"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-blue-500" />
            )}
          </button>

          <div className="flex items-center gap-2 text-white px-3 py-2 rounded-xl bg-gray-900/40 backdrop-blur-xl border border-white/20 shadow-[0_4px_16px_0_rgba(0,0,0,0.4),0_0_30px_0_rgba(138,92,246,0.1)]">
            <div className="p-1 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-purple/20">
              <User className="w-4 h-4" />
            </div>
            <span className="font-medium">{user?.username}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-gray-900/40 via-red-900/20 to-gray-900/40 backdrop-blur-xl hover:from-red-900/30 hover:via-red-900/40 hover:to-red-900/30 text-white rounded-xl transition-all duration-300 font-medium border border-white/20 hover:border-red-400/50 shadow-[0_4px_16px_0_rgba(0,0,0,0.4),0_0_30px_0_rgba(138,92,246,0.1)] hover:shadow-[0_4px_16px_0_rgba(239,68,68,0.3),0_0_30px_0_rgba(239,68,68,0.2)]"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
