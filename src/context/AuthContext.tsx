import React, { createContext, useContext, useState, useEffect } from 'react';
import { StaffUser } from '../types/backend';
import { authService } from '../services/authService';

export interface AuthContextType {
  user: StaffUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  roleLabel: string;
  login: (email: string, password: string) => Promise<StaffUser>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inisialisasi session dari storage dan verifikasi dengan /api/staff/me
  useEffect(() => {
    const initAuth = async () => {
      const { user: storedUser, token: storedToken } = authService.getStoredSession();
      if (storedUser && storedToken) {
        setUser(storedUser);
        setToken(storedToken);

        // Verifikasi sesi di background
        try {
          const liveUser = await authService.getProfile();
          if (liveUser) {
            setUser(liveUser);
          }
        } catch {
          // Token expired or server unreachable
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<StaffUser> => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      setToken(response.token);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    const profile = await authService.getProfile();
    if (profile) setUser(profile);
  };

  const isAdmin = user?.role_access_user === 4;
  const roleLabel =
    user?.role_access_user === 4
      ? 'Admin'
      : user?.email.includes('kantin')
      ? 'Staff Kantin'
      : user?.email.includes('kafe')
      ? 'Staff Kafe'
      : user?.role_access_user === 1
      ? 'Guru'
      : 'Staf';

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    isAdmin,
    roleLabel,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
