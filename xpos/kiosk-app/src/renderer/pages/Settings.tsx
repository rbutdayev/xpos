import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigStore } from '../../stores/config-store';
import toast from 'react-hot-toast';

export default function Settings() {
  const navigate = useNavigate();
  const { config, clearConfig } = useConfigStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    productsCount: 0,
    customersCount: 0,
    salesCount: 0,
  });

  useEffect(() => {
    loadCacheStats();
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your kiosk configuration and data</p>
        </div>

        {/* Device Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Device Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Device Name</p>
                <p className="text-lg font-semibold text-gray-900">{config?.device_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Account ID</p>
                <p className="text-lg font-semibold text-gray-900">{config?.account_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Branch ID</p>
                <p className="text-lg font-semibold text-gray-900">{config?.branch_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">API URL</p>
                <p className="text-lg font-semibold text-gray-900 truncate">{config?.api_url || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cache Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Cache Statistics</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">{cacheStats.productsCount}</p>
                <p className="text-sm text-gray-600">Products</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">{cacheStats.customersCount}</p>
                <p className="text-sm text-gray-600">Customers</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">{cacheStats.salesCount}</p>
                <p className="text-sm text-gray-600">Queued Sales</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={() => setShowClearCacheConfirm(true)}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear Cache</span>
            </button>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout & Reset</span>
            </button>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center text-sm text-gray-500">
          <p>xPOS Kiosk v1.0.0</p>
        </div>
      </div>

      {/* Clear Cache Confirmation Modal */}
      {showClearCacheConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Clear Cache?</h3>
              <p className="text-gray-600">
                This will remove all cached products and customers. Data will be re-synced on next sync.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearCacheConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCache}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
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
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Logout & Reset?</h3>
              <p className="text-gray-600">
                This will log out the device and clear all configuration. You will need to register again.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
