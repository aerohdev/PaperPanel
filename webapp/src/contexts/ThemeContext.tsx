import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import client from '../api/client';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default to dark mode
  const [theme, setThemeState] = useState<Theme>('dark');
  const [initialized, setInitialized] = useState(false);

  // Fetch user's theme preference on mount if logged in
  useEffect(() => {
    const fetchUserTheme = async () => {
      const username = localStorage.getItem('username');
      if (username) {
        try {
          const response = await client.get<{ theme: string }>(`/users/${username}/theme`);
          const userTheme = response.data.theme;
          if (userTheme === 'dark' || userTheme === 'light') {
            setThemeState(userTheme);
          }
        } catch (error) {
          console.error('Failed to fetch user theme:', error);
          // Fall back to dark mode on error
        }
      }
      setInitialized(true);
    };

    fetchUserTheme();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);

    // Save to backend if logged in
    const username = localStorage.getItem('username');
    if (username) {
      try {
        await client.put(`/users/${username}/theme`, { theme: newTheme });
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);

    // Save to backend if logged in
    const username = localStorage.getItem('username');
    if (username) {
      try {
        await client.put(`/users/${username}/theme`, { theme: newTheme });
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
