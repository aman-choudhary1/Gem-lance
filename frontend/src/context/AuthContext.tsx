import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, SavedAuction } from '../types';
import { authService } from '../services/authService';
import { savedService } from '../services/savedService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  savedAuctionIds: Set<string>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemo: (role: 'ADMIN' | 'BUYER') => Promise<void>;
  toggleSave: (auctionId: string) => Promise<boolean>;
  refreshSavedList: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('auctionlens_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savedAuctionIds, setSavedAuctionIds] = useState<Set<string>>(new Set());

  const refreshSavedList = useCallback(async () => {
    if (!user) {
      setSavedAuctionIds(new Set());
      return;
    }
    try {
      const saved = await savedService.getSavedAuctions();
      setSavedAuctionIds(new Set(saved.map((s: SavedAuction) => s.auctionId)));
    } catch {
      // ignore if unauthorized
    }
  }, [user]);

  // Load initial session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auctionlens_access_token');
      if (token) {
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
          localStorage.setItem('auctionlens_user', JSON.stringify(freshUser));
        } catch {
          setUser(null);
          localStorage.removeItem('auctionlens_access_token');
          localStorage.removeItem('auctionlens_user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Update saved items whenever user changes
  useEffect(() => {
    if (user) {
      refreshSavedList();
    } else {
      setSavedAuctionIds(new Set());
    }
  }, [user, refreshSavedList]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login({ email, password });
      localStorage.setItem('auctionlens_access_token', res.accessToken);
      localStorage.setItem('auctionlens_user', JSON.stringify(res.user));
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.register({ name, email, password });
      localStorage.setItem('auctionlens_access_token', res.accessToken);
      localStorage.setItem('auctionlens_user', JSON.stringify(res.user));
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setSavedAuctionIds(new Set());
      localStorage.removeItem('auctionlens_access_token');
      localStorage.removeItem('auctionlens_user');
    }
  };

  const loginAsDemo = async (role: 'ADMIN' | 'BUYER') => {
    if (role === 'ADMIN') {
      await login('admin@auctionlens.io', 'AdminPassword@2026');
    } else {
      await login('buyer@auctionlens.io', 'BuyerPassword@2026');
    }
  };

  const toggleSave = async (auctionId: string): Promise<boolean> => {
    if (!user) {
      throw new Error('Please login to save auctions');
    }
    const isCurrentlySaved = savedAuctionIds.has(auctionId);
    if (isCurrentlySaved) {
      await savedService.removeSavedAuction(auctionId);
      setSavedAuctionIds((prev) => {
        const next = new Set(prev);
        next.delete(auctionId);
        return next;
      });
      return false;
    } else {
      await savedService.saveAuction(auctionId);
      setSavedAuctionIds((prev) => new Set(prev).add(auctionId));
      return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        savedAuctionIds,
        login,
        register,
        logout,
        loginAsDemo,
        toggleSave,
        refreshSavedList
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
