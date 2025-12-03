import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import SecurityBanner from './SecurityBanner';
import UpdateBanner from './UpdateBanner';
import LiquidEther from './LiquidEther';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import logoBlack from '../img/pp_logo_black.png';
import logoWhite from '../img/pp_logo_white.png';

export default function Layout() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen relative overflow-hidden" style={{ backgroundColor: '#060010' }}>
      {/* LiquidEther Background */}
      <div className="absolute inset-0 w-full h-full">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous={true}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
          className="w-full h-full opacity-70"
        />
      </div>
      {/* Unified Header across the top */}
      <header className="
        fixed top-0 left-0 right-0
        bg-gradient-to-r from-gray-900/40 via-black/50 to-gray-900/40
        backdrop-blur-3xl backdrop-saturate-150
        border-b border-white/20
        px-6 py-4
        shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15)]
        z-50
      ">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <img
              src={logoWhite}
              alt="PaperPanel"
              className="h-10 w-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-white">PaperPanel</h1>
            </div>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-4">
            <div className="
              flex items-center gap-2
              text-white
              px-3 py-2 rounded-xl
              bg-white/5 backdrop-blur-xl
              border border-white/10
            ">
              <div className="p-1 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-purple/20">
                <User className="w-4 h-4" />
              </div>
              <span className="font-medium">{user?.username}</span>
            </div>

            <button
              onClick={handleLogout}
              className="
                flex items-center gap-2
                px-4 py-2
                bg-red-500 hover:bg-red-600
                text-white
                rounded-xl
                transition-colors
                font-medium
                shadow-lg
              "
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex w-full pt-[73px] relative z-10">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <SecurityBanner />
          <UpdateBanner />
          <main className="flex-1 overflow-auto p-6" style={{ backgroundColor: 'transparent' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
