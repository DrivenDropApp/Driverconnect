import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminStore {
  admin: any | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (admin: any, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      admin: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (admin, accessToken) => set({ admin, accessToken, isAuthenticated: true }),
      clearAuth: () => set({ admin: null, accessToken: null, isAuthenticated: false }),
    }),
    { name: 'dc-admin-auth' },
  ),
);
