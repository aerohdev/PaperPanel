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
            className="p-2 rounded-xl bg-light-card dark:bg-dark-card hover:bg-gradient-to-br hover:from-primary-500/20 hover:to-accent-purple/20 text-light-text-primary dark:text-dark-text-primary transition-colors shadow-soft dark:shadow-dark-soft border border-light-border dark:border-dark-border"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-blue-500" />
            )}
          </button>

          <div className="flex items-center gap-2 text-light-text-primary dark:text-dark-text-primary px-3 py-2 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border">
            <div className="p-1 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-purple/20">
              <User className="w-4 h-4" />
            </div>
            <span className="font-medium">{user?.username}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
