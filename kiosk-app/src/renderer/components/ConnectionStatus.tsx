import React, { useEffect } from 'react';
import { useSyncStore } from '../../stores/sync-store';

export default function ConnectionStatus() {
  const { isOnline, queuedSalesCount, isSyncing, updateSyncStatus } = useSyncStore();

  useEffect(() => {
    // Load sync status on mount
    loadSyncStatus();

    // Refresh every 10 seconds
    const interval = setInterval(loadSyncStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await window.ipc.getSyncStatus();
      updateSyncStatus({
        isOnline: status.is_online,
        lastSyncAt: status.last_sync_at,
        queuedSalesCount: status.queued_sales_count,
        isSyncing: status.is_syncing,
        syncError: status.sync_error,
      });
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Sync Status */}
      {isSyncing && (
        <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm font-medium text-blue-700">Syncing...</span>
        </div>
      )}

      {/* Queued Sales Badge */}
      {queuedSalesCount > 0 && (
        <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-2 rounded-lg">
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-yellow-700">{queuedSalesCount} queued</span>
        </div>
      )}

      {/* Connection Status */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
        isOnline ? 'bg-green-50' : 'bg-red-50'
      }`}>
        <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-600' : 'bg-red-600'} animate-pulse`}></div>
        <span className={`text-sm font-medium ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  );
}
