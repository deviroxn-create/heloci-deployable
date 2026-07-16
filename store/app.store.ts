import { create } from "zustand";

interface AppState {
  sidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen })
}));
