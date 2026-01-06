import { create } from 'zustand';

interface SyncStore {
  isOnline: boolean;
  lastSyncAt: string | null;
  queuedSalesCount: number;
  isSyncing: boolean;
  syncError: string | null;
  syncProgress: number; // 0-100

  setOnlineStatus: (isOnline: boolean) => void;
  setLastSyncAt: (timestamp: string) => void;
  setQueuedSalesCount: (count: number) => void;
  setSyncStatus: (isSyncing: boolean, progress?: number) => void;
  setSyncError: (error: string | null) => void;
  updateSyncStatus: (status: {
    isOnline?: boolean;
    lastSyncAt?: string | null;
    queuedSalesCount?: number;
    isSyncing?: boolean;
    syncError?: string | null;
    syncProgress?: number;
  }) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  isOnline: false,
  lastSyncAt: null,
  queuedSalesCount: 0,
  isSyncing: false,
  syncError: null,
  syncProgress: 0,

  setOnlineStatus: (isOnline) => set({ isOnline }),

  setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),

  setQueuedSalesCount: (count) => set({ queuedSalesCount: count }),

  setSyncStatus: (isSyncing, progress = 0) => set({ isSyncing, syncProgress: progress }),

  setSyncError: (error) => set({ syncError: error }),

  updateSyncStatus: (status) => set(status),
}));
