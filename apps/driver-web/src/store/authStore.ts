import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Driver {
  _id: string;
  phone: string;
  name: string;
  kyc: { status: 'pending' | 'verified' | 'rejected'; licenseUrl?: string; aadhaarUrl?: string; photoUrl?: string };
  isOnline: boolean;
  rating: number;
  totalTrips: number;
}

interface DriverAuthStore {
  driver: Driver | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (driver: Driver, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateDriver: (updates: Partial<Driver>) => void;
  setOnline: (isOnline: boolean) => void;
}

export const useDriverAuthStore = create<DriverAuthStore>()(
  persist(
    (set) => ({
      driver: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (driver, accessToken, refreshToken) =>
        set({ driver, accessToken, refreshToken, isAuthenticated: true }),

      clearAuth: () =>
        set({ driver: null, accessToken: null, refreshToken: null, isAuthenticated: false }),

      updateDriver: (updates) =>
        set((state) => ({
          driver: state.driver ? { ...state.driver, ...updates } : null,
        })),

      setOnline: (isOnline) =>
        set((state) => ({
          driver: state.driver ? { ...state.driver, isOnline } : null,
        })),
    }),
    {
      name: 'dc-driver-auth',
    },
  ),
);
