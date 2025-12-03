import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import logoBlack from '../img/pp_logo_black.png';
import logoWhite from '../img/pp_logo_white.png';
import LiquidEther from '../components/LiquidEther';

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#060010' }}>
      {/* Liquid Ether Background */}
      <div className="absolute inset-0 w-full h-full">
        <LiquidEther
          colors={[ '#5227FF', '#FF9FFC', '#B19EEF' ]}
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
      
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl
  bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40
  backdrop-blur-3xl backdrop-saturate-150
  border border-white/20
  shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)]
  hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.7),0_0_80px_0_rgba(138,92,246,0.2),inset_0_1px_0_0_rgba(255,255,255,0.25)]
  transition-all duration-300">
        <div className="flex flex-col items-center justify-center mb-8">
          <img
            src={logoWhite}
            alt="PaperPanel Logo"
            className="w-32 h-32 sm:w-40 sm:h-40 object-contain mb-4"
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">PaperPanel</h1>
            <p className="text-gray-400 text-sm">Server Management</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300/70" />
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3
  bg-white/5 backdrop-blur-xl
  text-white placeholder-white/40
  rounded-xl
  border border-white/10
  focus:border-purple-400/60 focus:bg-white/10
  focus:shadow-[0_0_20px_rgba(168,85,247,0.3)]
  outline-none transition-all duration-200"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300/70" />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3
  bg-white/5 backdrop-blur-xl
  text-white placeholder-white/40
  rounded-xl
  border border-white/10
  focus:border-purple-400/60 focus:bg-white/10
  focus:shadow-[0_0_20px_rgba(168,85,247,0.3)]
  outline-none transition-all duration-200"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6
  bg-gradient-to-r from-purple-500 to-pink-500
  hover:from-purple-400 hover:to-pink-400
  disabled:from-gray-600 disabled:to-gray-700
  text-white font-semibold py-3 rounded-xl
  shadow-[0_4px_20px_rgba(168,85,247,0.4)]
  hover:shadow-[0_6px_30px_rgba(168,85,247,0.6)]
  transition-all duration-200
  disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
