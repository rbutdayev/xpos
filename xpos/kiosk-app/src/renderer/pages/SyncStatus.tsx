import React, { useEffect, useState } from 'react';
import { useSyncStore } from '../../stores/sync-store';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function SyncStatus() {
  const {
    isOnline,
    lastSyncAt,
    queuedSalesCount,
    isSyncing,
    syncError,
    syncProgress,
    updateSyncStatus,
  } = useSyncStore();

  const [salesQueue, setSalesQueue] = useState<any[]>([]);

  useEffect(() => {
    loadSyncStatus();
    loadQueuedSales();

    const interval = setInterval(() => {
      loadSyncStatus();
      loadQueuedSales();
    }, 5000); // Refresh every 5 seconds

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

  const loadQueuedSales = async () => {
    try {
      const sales = await window.ipc.getQueuedSales();
      setSalesQueue(sales);
    } catch (error) {
      console.error('Failed to load queued sales:', error);
    }
  };

  const handleManualSync = async () => {
    try {
      toast.loading('Starting sync...');
      await window.ipc.triggerSync();
      await loadSyncStatus();
      toast.success('Sync completed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Sync failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sync Status</h1>
          <p className="text-gray-600">Monitor synchronization status and queued sales</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Online Status */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Connection Status</p>
                <p className={`text-2xl font-bold ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
                <svg className={`w-6 h-6 ${isOnline ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isOnline ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </div>
            </div>
          </div>

          {/* Queued Sales */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Queued Sales</p>
                <p className="text-2xl font-bold text-gray-900">{queuedSalesCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Last Sync */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Last Sync</p>
                <p className="text-lg font-semibold text-gray-900">
                  {lastSyncAt ? formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true }) : 'Never'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Progress */}
        {isSyncing && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Syncing...</h2>
              <span className="text-sm text-gray-600">{syncProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary-600 h-full transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Sync Error */}
        {syncError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Sync Error</h3>
                <p className="text-sm text-red-700 mt-1">{syncError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Manual Sync</span>
          </button>
        </div>

        {/* Queued Sales List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Queued Sales</h2>
          </div>
          <div className="overflow-x-auto">
            {salesQueue.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">No queued sales</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retry Count</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesQueue.map((sale) => (
                    <tr key={sale.local_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{sale.local_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${sale.total.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDistanceToNow(new Date(sale.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          sale.sync_status === 'synced' ? 'bg-green-100 text-green-800' :
                          sale.sync_status === 'failed' ? 'bg-red-100 text-red-800' :
                          sale.sync_status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sale.sync_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{sale.retry_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
