import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigStore } from '../../stores/config-store';
import toast from 'react-hot-toast';

export default function Setup() {
  const navigate = useNavigate();
  const { setConfig, setLoading, setError } = useConfigStore();

  const [formData, setFormData] = useState({
    token: '',
    apiUrl: 'https://your-api.com',
    deviceName: 'Kiosk-1',
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async () => {
    if (!formData.token || !formData.apiUrl || !formData.deviceName) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsRegistering(true);
    setError(null);
    setLoading(true);

    try {
      // Register device with backend
      setSyncMessage('Registering device...');
      setSyncProgress(25);

      const config = await window.ipc.registerDevice(
        formData.token,
        formData.apiUrl,
        formData.deviceName
      );

      setSyncMessage('Device registered successfully!');
      setSyncProgress(50);

      // Initial sync
      setSyncMessage('Syncing products...');
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSyncProgress(75);

      setSyncMessage('Syncing customers...');
      await window.ipc.triggerSync();
      setSyncProgress(100);

      // Save config
      setConfig(config);

      toast.success('Kiosk registered successfully!');

      // Navigate to POS after short delay
      setTimeout(() => {
        navigate('/pos');
      }, 1000);
    } catch (error: any) {
      console.error('Registration failed:', error);
      setError(error.message || 'Failed to register device');
      toast.error(error.message || 'Failed to register device');
      setSyncProgress(0);
      setSyncMessage('');
    } finally {
      setIsRegistering(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-primary-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">xPOS Kiosk Setup</h1>
          <p className="text-gray-600">Register your kiosk to get started</p>
        </div>

        {!isRegistering ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 mb-2">
                API URL
              </label>
              <input
                type="text"
                id="apiUrl"
                name="apiUrl"
                value={formData.apiUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                placeholder="https://your-api.com"
              />
            </div>

            <div>
              <label htmlFor="deviceName" className="block text-sm font-medium text-gray-700 mb-2">
                Device Name
              </label>
              <input
                type="text"
                id="deviceName"
                name="deviceName"
                value={formData.deviceName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                placeholder="Kiosk-Store-1"
              />
            </div>

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                Kiosk Token
              </label>
              <input
                type="password"
                id="token"
                name="token"
                value={formData.token}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg font-mono"
                placeholder="ksk_abc123..."
              />
            </div>

            <button
              onClick={handleRegister}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-lg shadow-lg"
            >
              Register Device
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mb-4"></div>
              <p className="text-lg font-medium text-gray-900 mb-2">{syncMessage}</p>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${syncProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">{syncProgress}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
