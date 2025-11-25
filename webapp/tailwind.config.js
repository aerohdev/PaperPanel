/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Dark Theme Colors - True Black/Grey (No blueish tint)
        dark: {
          bg: '#0a0a0a',
          surface: '#121212',
          card: '#1a1a1a',
          border: '#2a2a2a',
          hover: '#222222',
          text: {
            primary: '#ffffff',
            secondary: '#b0b0b0',
            muted: '#707070',
          }
        },
        // Light Theme Colors - Modern Cool Grey
        light: {
          bg: '#f5f5f7',
          surface: '#ffffff',
          card: '#ffffff',
          border: '#d1d1d6',
          hover: '#e8e8ed',
          text: {
            primary: '#1d1d1f',
            secondary: '#424245',
            muted: '#86868b',
          }
        },
        // Modern Accent Colors with Gradients
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#3b82f6',
        },
        accent: {
          purple: '#8b5cf6',
          pink: '#ec4899',
          cyan: '#06b6d4',
          emerald: '#10b981',
          orange: '#f59e0b',
        },
        gradient: {
          from: {
            blue: '#4facfe',
            purple: '#a855f7',
            pink: '#ec4899',
            orange: '#fb923c',
            green: '#10b981',
          },
          to: {
            blue: '#00f2fe',
            purple: '#3b82f6',
            pink: '#f472b6',
            orange: '#fbbf24',
            green: '#34d399',
          }
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-blue': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-purple': 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
        'gradient-pink': 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
        'gradient-orange': 'linear-gradient(135deg, #fb923c 0%, #fbbf24 100%)',
        'gradient-green': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0a0a0a 0%, #121212 100%)',
        'gradient-dark-elevated': 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        'gradient-card': 'linear-gradient(145deg, #1a1a1a 0%, #252525 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #0a0a0a 0%, #121212 100%)',
        'gradient-light': 'linear-gradient(135deg, #f5f5f7 0%, #ffffff 100%)',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'strong': '0 8px 24px rgba(0, 0, 0, 0.15)',
        'elevated': '0 4px 20px rgba(0, 0, 0, 0.5)',
        'elevated-lg': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.4)',
        'inner-glow': 'inset 0 1px 2px rgba(255, 255, 255, 0.05)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.3)',
        'dark-soft': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'dark-medium': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'dark-strong': '0 8px 24px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-in-center': 'scaleInCenter 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleInCenter: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}
