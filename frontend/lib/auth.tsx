'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
  email: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, username: string, email: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('music_platform_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('music_platform_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, username: string, email: string) => {
    const userData = { token, username, email };
    setUser(userData);
    localStorage.setItem('music_platform_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('music_platform_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
