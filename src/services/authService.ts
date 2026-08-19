import { apiClient } from './apiClient';
import { StaffUser } from '../types/backend';

const STORAGE_KEY_USER = 'portal_bendahara_session_user';
const STORAGE_KEY_TOKEN = 'portal_bendahara_session_token';

export interface LoginResponse {
  token: string;
  user: StaffUser;
}

export const authService = {
  /**
   * Login staff via POST /api/staff/login
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/staff/login', {
      email,
      password,
      device_name: 'Web Portal',
    });

    if (!response || !response.token) {
      throw new Error('Gagal login. Token tidak ditemukan dari respons server.');
    }

    try {
      sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(response.user));
      sessionStorage.setItem(STORAGE_KEY_TOKEN, response.token);
      localStorage.setItem(STORAGE_KEY_TOKEN, response.token);
    } catch {
      // Ignore storage quota error
    }

    return response;
  },

  /**
   * Ambil session user yang tersimpan di storage
   */
  getStoredSession(): { user: StaffUser | null; token: string | null } {
    try {
      const storedUser = sessionStorage.getItem(STORAGE_KEY_USER);
      const storedToken = sessionStorage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem(STORAGE_KEY_TOKEN);
      if (storedUser && storedToken) {
        return { user: JSON.parse(storedUser), token: storedToken };
      }
    } catch {
      // Ignore parse error
    }
    return { user: null, token: null };
  },

  /**
   * Ambil profil user terkini dari backend GET /api/staff/me
   */
  async getProfile(): Promise<StaffUser | null> {
    try {
      const res = await apiClient.get<{ user: StaffUser }>('/api/staff/me');
      if (res && res.user) {
        sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(res.user));
        return res.user;
      }
    } catch {
      // Return stored session if offline / failed
    }
    return this.getStoredSession().user;
  },

  /**
   * Logout dan hapus token via POST /api/staff/logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/staff/logout');
    } catch {
      // Ignore logout error
    } finally {
      sessionStorage.removeItem(STORAGE_KEY_USER);
      sessionStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  },
};
