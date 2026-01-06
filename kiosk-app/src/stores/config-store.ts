import { create } from 'zustand';
import type { AppConfig } from '../types';

interface ConfigStore {
  config: AppConfig | null;
  taxRate: number; // Tax rate as percentage (e.g., 18 for 18%)
  isLoading: boolean;
  error: string | null;
  isLocked: boolean; // Lock screen state

  setConfig: (config: AppConfig) => void;
  clearConfig: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateConfig: (updates: Partial<AppConfig>) => void;
  setTaxRate: (taxRate: number) => void;
  loadTaxRate: () => Promise<void>;
  lockScreen: () => void;
  unlockScreen: () => void;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: null,
  taxRate: 0, // Default 0% tax
  isLoading: false,
  error: null,
  isLocked: false, // Screen not locked by default

  setConfig: (config) => set({ config, error: null }),

  clearConfig: () => set({ config: null, taxRate: 0, error: null, isLocked: false }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  updateConfig: (updates) => {
    const currentConfig = get().config;
    if (currentConfig) {
      set({ config: { ...currentConfig, ...updates } });
    }
  },

  setTaxRate: (taxRate) => set({ taxRate }),

  loadTaxRate: async () => {
    try {
      // Load fiscal config to get default tax rate
      const fiscalConfig = await window.ipc.getFiscalConfig();

      if (fiscalConfig && fiscalConfig.default_tax_rate !== null) {
        set({ taxRate: fiscalConfig.default_tax_rate });
      } else {
        // Default to 0% if no fiscal config or tax rate
        set({ taxRate: 0 });
      }
    } catch (error) {
      console.error('Failed to load tax rate:', error);
      set({ taxRate: 0 }); // Fallback to 0% on error
    }
  },

  lockScreen: () => set({ isLocked: true }),

  unlockScreen: () => set({ isLocked: false }),
}));
