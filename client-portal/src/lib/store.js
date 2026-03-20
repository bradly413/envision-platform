import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePortalStore = create(persist(
  (set) => ({
    token: null,
    portal: null,
    setPortalAuth: (token, portal) => set({ token, portal }),
    logout: () => set({ token: null, portal: null }),
  }),
  { name: 'envision-portal-auth' }
));
