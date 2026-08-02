import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAccessToken } from './api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  teamId: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      login: (user, accessToken, refreshToken) => {
        setAccessToken(accessToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
      },
      logout: () => {
        setAccessToken(null);
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
      },
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'honeyai-auth',
    }
  )
);