'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAccessToken, clearTokens as clearAuthTokens } from '@/lib/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  logout: () => void;
  checkAuthStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const checkAuthStatus = () => {
    const token = getAccessToken();
    setIsLoggedIn(!!token);
  };

  const logout = () => {
    clearAuthTokens();
    setIsLoggedIn(false);
  };

  useEffect(() => {
    setMounted(true);
    checkAuthStatus();
  }, []);

  if (!mounted) {
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}