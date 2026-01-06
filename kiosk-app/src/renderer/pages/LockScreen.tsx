import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfigStore } from '../../stores/config-store';
import toast from 'react-hot-toast';
import xposLogo from '../../assets/xpos-logo.png';

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const { t } = useTranslation();
  const { config, updateConfig } = useConfigStore();
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [time, setTime] = useState(new Date());
  const [focusedField, setFocusedField] = useState<'userId' | 'pin'>('userId');

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNumpadInput = (digit: string) => {
    if (focusedField === 'userId') {
      setUserId(userId + digit);
    } else {
      if (pin.length < 6) {
        setPin(pin + digit);
      }
    }
  };

  const handleBackspace = () => {
    if (focusedField === 'userId') {
      setUserId(userId.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (focusedField === 'userId') {
      setUserId('');
    } else {
      setPin('');
    }
  };

  const handleUnlock = async () => {
    if (!userId || !pin) {
      toast.error(t('pinLogin.enterUserIdAndPin'));
      return;
    }

    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      toast.error(t('pinLogin.invalidUserId'));
      return;
    }

    if (pin.length < 4) {
      toast.error(t('pinLogin.pinTooShort'));
      return;
    }

    setIsUnlocking(true);

    try {
      // Call backend to verify PIN (same as login)
      const userData = await window.ipc.loginWithPin(userIdNum, pin);

      // Update config with user info
      updateConfig({
        user_id: userData.user_id,
        user_name: userData.user_name,
        is_logged_in: true,
      });

      toast.success(t('lockScreen.unlocked'));
      onUnlock();
    } catch (error: any) {
      console.error('Unlock failed:', error);

      // Extract clean error message
      let errorMessage = error.message || t('lockScreen.unlockFailed');
      if (errorMessage.includes('Error invoking remote method')) {
        const match = errorMessage.match(/Error: ([^]+)$/);
        if (match && match[1]) {
          errorMessage = match[1];
        }
      }

      toast.error(errorMessage, {
        duration: 4000,
      });
      setPin('');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Company Branding (70%) */}
      <div className="w-[70%] relative overflow-hidden flex items-center justify-center">
        {/* Full-size Background Image */}
        {config?.logo_path ? (
          <>
            {/* Custom Background Image - Full Cover */}
            <img
              src={config.logo_path}
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                console.error('Failed to load background image:', config.logo_path);
                console.error('Image error event:', e);
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/40"></div>
          </>
        ) : (
          <>
            {/* Default Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800"></div>
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
              <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
            </div>
          </>
        )}

        {/* xPOS Logo in upper left (when background image is set) */}
        {config?.logo_path && (
          <div className="absolute top-8 left-8 z-10">
            <img
              src={xposLogo}
              alt="xPOS Logo"
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
        )}

        {/* Content - only shown when NO custom background */}
        {!config?.logo_path && (
          <div className="relative z-10 text-center text-white px-12">
            {/* Time Display */}
            <div className="mb-12">
              <div className="text-7xl font-bold mb-2">
                {time.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xl text-blue-100">
                {time.toLocaleDateString('az-AZ', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* Company Icon */}
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border-4 border-white/30 shadow-2xl">
                <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            {/* Company Name */}
            <h1 className="text-6xl font-bold mb-4">{t('app.name')}</h1>
            <p className="text-2xl text-blue-100">{t('lockScreen.title')}</p>
          </div>
        )}
      </div>

      {/* Right Side - Login Form (30%) */}
      <div className="w-[30%] bg-gray-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gray-800 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('lockScreen.title')}</h1>
            <p className="text-gray-600">{t('lockScreen.subtitle')}</p>
          </div>

          {/* User ID Input */}
          <div className="mb-6">
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
              {t('pinLogin.userId')}
            </label>
            <input
              type="text"
              inputMode="none"
              id="userId"
              value={userId}
              onFocus={() => setFocusedField('userId')}
              onChange={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUnlock();
                } else if (e.key !== 'Tab') {
                  e.preventDefault();
                }
              }}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 text-lg text-center font-mono transition-all ${
                focusedField === 'userId'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 bg-white'
              }`}
              placeholder="123"
              disabled={isUnlocking}
              autoFocus
              readOnly
            />
          </div>

          {/* PIN Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('pinLogin.pin')}
            </label>
            <div
              className="flex justify-center gap-2 mb-4 cursor-pointer"
              onClick={() => setFocusedField('pin')}
            >
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
                    focusedField === 'pin' && index === pin.length
                      ? 'border-primary-500 bg-primary-100 ring-2 ring-primary-200'
                      : index < pin.length
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  {index < pin.length && (
                    <div className="w-3 h-3 bg-primary-600 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                onClick={() => handleNumpadInput(digit.toString())}
                disabled={isUnlocking || (focusedField === 'pin' && pin.length >= 6)}
                className="h-16 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg text-2xl font-bold text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={handleClear}
              disabled={isUnlocking || (focusedField === 'userId' ? userId.length === 0 : pin.length === 0)}
              className="h-16 bg-red-100 hover:bg-red-200 active:bg-red-300 rounded-lg text-sm font-semibold text-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.clear')}
            </button>
            <button
              onClick={() => handleNumpadInput('0')}
              disabled={isUnlocking || (focusedField === 'pin' && pin.length >= 6)}
              className="h-16 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg text-2xl font-bold text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              disabled={isUnlocking || (focusedField === 'userId' ? userId.length === 0 : pin.length === 0)}
              className="h-16 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg text-sm font-semibold text-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⌫
            </button>
          </div>

          {/* Unlock Button */}
          <button
            onClick={handleUnlock}
            disabled={!userId || pin.length < 4 || isUnlocking}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUnlocking ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                {t('lockScreen.unlocking')}
              </div>
            ) : (
              t('lockScreen.unlock')
            )}
          </button>

          {/* Device Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>{config?.device_name}</p>
            <p className="text-xs mt-1">
              {t('pinLogin.branch')}: {config?.branch_id}
            </p>
          </div>

          {/* Reset Settings Link */}
          <div className="mt-4 text-center">
            <button
              onClick={async () => {
                if (confirm(t('common.confirmResetSettings') || 'Are you sure you want to reset device settings? You will need to re-register the device.')) {
                  try {
                    await window.ipc.clearConfig();
                    toast.success(t('common.settingsCleared') || 'Settings cleared. Redirecting to setup...');
                    setTimeout(() => {
                      window.location.hash = '#/setup';
                      window.location.reload();
                    }, 500);
                  } catch (error) {
                    console.error('Failed to clear config:', error);
                    toast.error(t('common.settingsClearFailed') || 'Failed to clear settings');
                  }
                }
              }}
              disabled={isUnlocking}
              className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.resetSettings')} ⚙️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
