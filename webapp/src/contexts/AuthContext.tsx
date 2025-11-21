import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import client from '../api/client';
import type { AuthResponse } from '../types/api';

interface User {
  token: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
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

  const login = async (username: string, password: string): Promise<void> => {
    const response = await client.post<AuthResponse>('/auth/login', { username, password });
    const { token, username: returnedUsername } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('username', returnedUsername || username);

    setUser({ token, username: returnedUsername || username });
  };

  const logout = async (): Promise<void> => {
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
