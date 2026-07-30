import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearBuilderWorkspaceCache } from './builderWorkspaceCache';

export const useAuthStore = create(persist(
  (set) => ({
    token: null,
    user: null,
    setAuth: (token, user) => set({ token, user }),
    logout: () => {
      clearBuilderWorkspaceCache();
      set({ token: null, user: null });
    },
  }),
  { name: 'envision-admin-auth' }
));

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  activeClient: null,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveClient: (client) => set({ activeClient: client }),
}));
