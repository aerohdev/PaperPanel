import { createContext, useState, useContext, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token && username) {
      setUser({ token, username });
    }

    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const response = await client.post('/auth/login', { username, password });
    const { token, username: returnedUsername } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('username', returnedUsername || username);

    setUser({ token, username: returnedUsername || username });
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
