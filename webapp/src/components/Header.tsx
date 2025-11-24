import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-500 to-accent-purple bg-clip-text text-transparent">
            PaperPanel Admin
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-xl bg-light-card dark:bg-dark-card hover:bg-gradient-to-br hover:from-primary-500/20 hover:to-accent-purple/20 text-light-text-primary dark:text-dark-text-primary transition-all shadow-soft dark:shadow-dark-soft border border-light-border dark:border-dark-border"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-blue-500" />
            )}
          </motion.button>

          <div className="flex items-center gap-2 text-light-text-primary dark:text-dark-text-primary px-3 py-2 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border">
            <div className="p-1 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-purple/20">
              <User className="w-4 h-4" />
            </div>
            <span className="font-medium">{user?.username}</span>
          </div>
          
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl transition-all shadow-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>
      </div>
    </header>
  );
}
