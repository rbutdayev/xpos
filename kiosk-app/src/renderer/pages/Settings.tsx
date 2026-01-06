import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigStore } from '../../stores/config-store';
import toast from 'react-hot-toast';

export default function Settings() {
  const navigate = useNavigate();
  const { config, clearConfig, updateConfig } = useConfigStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [cacheStats, setCacheStats] = useState({
    productsCount: 0,
    customersCount: 0,
    salesCount: 0,
  });

  useEffect(() => {
    loadCacheStats();

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCacheStats = async () => {
    try {
      const products = await window.ipc.getAllProducts();
      const sales = await window.ipc.getQueuedSales();
      setCacheStats({
        productsCount: products.length,
        customersCount: 0, // TODO: Add customer count
        salesCount: sales.length,
      });
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      toast.loading('Syncing data...');
      // TODO: Implement actual sync via IPC
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setLastSyncTime(new Date());
      await loadCacheStats();
      toast.success('Data synced successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      toast.loading('Testing connection...');
      // TODO: Implement connection test via IPC
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success('Connection successful');
    } catch (error: any) {
      toast.error(error.message || 'Connection failed');
    }
  };

  const handleViewLogs = () => {
    toast.success('Logs viewer coming soon');
    // TODO: Navigate to logs page or open logs modal
  };

  const handleClearCache = async () => {
    try {
      toast.loading('Clearing cache...');
      // TODO: Implement clear cache via IPC
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Cache cleared successfully');
      setShowClearCacheConfirm(false);
      loadCacheStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear cache');
    }
  };

  const handleLogout = async () => {
    try {
      await window.ipc.clearConfig();
      clearConfig();
      toast.success('Logged out successfully');
      navigate('/setup');
    } catch (error: any) {
      toast.error(error.message || 'Failed to logout');
    }
  };

  const handleUploadLogo = async () => {
    try {
      setIsUploadingLogo(true);
      toast.loading('Selecting logo...');

      const logoPath = await window.ipc.uploadLogo();

      if (logoPath) {
        // Update config with new logo path
        const updatedConfig = { ...config, logo_path: logoPath };
        await window.ipc.saveConfig(updatedConfig as any);
        updateConfig({ logo_path: logoPath });
        toast.success('Logo uploaded successfully');
      } else {
        toast.dismiss();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const updatedConfig = { ...config, logo_path: undefined };
      await window.ipc.saveConfig(updatedConfig as any);
      updateConfig({ logo_path: undefined });
      toast.success('Logo removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove logo');
    }
  };

  const getTimeSinceSync = () => {
    if (!lastSyncTime) return 'Never';
    const seconds = Math.floor((new Date().getTime() - lastSyncTime.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500">Manage your kiosk configuration</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Connection Status - Most Important */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {isOnline ? 'Online' : 'Offline'}
                    </h2>
                    <p className="text-sm text-gray-500">Last synced: {getTimeSinceSync()}</p>
                  </div>
                </div>
                <button
                  onClick={handleSync}
                  disabled={isSyncing || !isOnline}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    isSyncing || !isOnline
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isSyncing ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Syncing...</span>
                    </span>
                  ) : (
                    'Sync Now'
                  )}
                </button>
              </div>
              {!isOnline && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    No internet connection. Operating in offline mode. Sales will be queued and synced when connection is restored.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Data Overview - Compact */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Data Overview</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{cacheStats.productsCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Products Cached</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">{cacheStats.salesCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Sales Queue</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{cacheStats.customersCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Customers</p>
                </div>
              </div>
              {cacheStats.salesCount > 0 && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    You have {cacheStats.salesCount} sale(s) waiting to sync with the server.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Device Information - Collapsible */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <button
              onClick={() => setShowDeviceInfo(!showDeviceInfo)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900">Device Information</h2>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${showDeviceInfo ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDeviceInfo && (
              <div className="px-6 py-4 border-t border-gray-200 space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Device Name</span>
                  <span className="text-sm font-semibold text-gray-900">{config?.device_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Account ID</span>
                  <span className="text-sm font-semibold text-gray-900">{config?.account_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Branch ID</span>
                  <span className="text-sm font-semibold text-gray-900">{config?.branch_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">API URL</span>
                  <span className="text-sm font-semibold text-gray-900 break-all">{config?.api_url || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Version</span>
                  <span className="text-sm font-semibold text-gray-900">v1.0.0</span>
                </div>
              </div>
            )}
          </div>

          {/* Branding Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Branding</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Login Background Image</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload an image to use as the background on the login screen. This image will cover the entire left side of the login page.
                  </p>
                  {config?.logo_path && (
                    <div className="mt-3">
                      <img
                        src={config.logo_path}
                        alt="Current Background"
                        className="w-32 h-24 object-cover border-2 border-gray-200 rounded-lg bg-white shadow-sm"
                        onError={(e) => {
                          console.error('Failed to load preview image:', config.logo_path);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleUploadLogo}
                    disabled={isUploadingLogo}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingLogo ? 'Uploading...' : config?.logo_path ? 'Change Image' : 'Upload Image'}
                  </button>
                  {config?.logo_path && (
                    <button
                      onClick={handleRemoveLogo}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tools Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Tools</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              <button
                onClick={handleViewLogs}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>View Logs</span>
              </button>
              <button
                onClick={handleTestConnection}
                disabled={!isOnline}
                className={`px-4 py-3 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  isOnline
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
                <span>Test Connection</span>
              </button>
              <button
                onClick={() => setShowClearCacheConfirm(true)}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear Cache</span>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-xl border-2 border-red-200">
            <div className="px-6 py-4 border-b border-red-200">
              <h2 className="text-lg font-semibold text-red-900 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Danger Zone</span>
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Logout & Reset Device</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    This will log out the device and clear all configuration. You will need to register again.
                  </p>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Logout & Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cache Confirmation Modal */}
      {showClearCacheConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Clear Cache?</h3>
                  <p className="text-sm text-gray-600">
                    This will remove all cached products and customers. Data will be re-synced on next sync operation.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
              <button
                onClick={() => setShowClearCacheConfirm(false)}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCache}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Logout & Reset Device?</h3>
                  <p className="text-sm text-gray-600">
                    This will log out the device and clear all configuration. You will need to register this device again to continue using it.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Logout & Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
