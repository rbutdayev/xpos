import { create } from 'zustand';
import type { AppConfig } from '../types';

interface ConfigStore {
  config: AppConfig | null;
  isLoading: boolean;
  error: string | null;

  setConfig: (config: AppConfig) => void;
  clearConfig: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateConfig: (updates: Partial<AppConfig>) => void;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: null,
  isLoading: false,
  error: null,

  setConfig: (config) => set({ config, error: null }),

  clearConfig: () => set({ config: null, error: null }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  updateConfig: (updates) => {
    const currentConfig = get().config;
    if (currentConfig) {
      set({ config: { ...currentConfig, ...updates } });
    }
  },
}));
