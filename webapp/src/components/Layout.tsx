import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import SecurityBanner from './SecurityBanner';
import UpdateBanner from './UpdateBanner';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import logoBlack from '../img/pp_logo_black.png';
import logoWhite from '../img/pp_logo_white.png';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-light-bg dark:bg-[#0a0a0a] text-light-text-primary dark:text-dark-text-primary overflow-hidden">
      {/* Unified Header across the top */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md border-b border-light-border dark:border-[#2a2a2a] px-6 py-4 shadow-soft dark:shadow-dark-soft z-50">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <img
              src={theme === 'dark' ? logoWhite : logoBlack}
              alt="PaperPanel"
              className="h-10 w-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">PaperPanel</h1>
              <p className="text-xs text-light-text-muted dark:text-dark-text-muted">v3.5.20</p>
            </div>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white dark:bg-[#1a1a1a] hover:bg-gradient-to-br hover:from-primary-500/20 hover:to-accent-purple/20 text-light-text-primary dark:text-dark-text-primary transition-colors duration-300 shadow-soft dark:shadow-dark-soft border border-light-border dark:border-[#2a2a2a]"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-blue-500" />
              )}
            </button>

            <div className="flex items-center gap-2 text-light-text-primary dark:text-dark-text-primary px-3 py-2 rounded-xl bg-white dark:bg-[#1a1a1a] border border-light-border dark:border-[#2a2a2a]">
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

      {/* Main Content Area with Sidebar */}
      <div className="flex w-full pt-[88px]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <SecurityBanner />
          <UpdateBanner />
          <main className="flex-1 overflow-auto bg-light-bg dark:bg-[#0a0a0a] p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
