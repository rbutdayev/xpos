import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfigStore } from '../../stores/config-store';
import { useSyncStore } from '../../stores/sync-store';

interface TopMenuBarProps {
  onLockScreen?: () => void;
}

export default function TopMenuBar({ onLockScreen }: TopMenuBarProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = useConfigStore();
  const { queuedSalesCount } = useSyncStore();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'az' ? 'en' : 'az';
    i18n.changeLanguage(newLang);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setShowSettingsMenu(false);
  };

  const handleLockScreen = () => {
    setShowSettingsMenu(false);
    if (onLockScreen) {
      onLockScreen();
    }
  };

  const isCurrentPath = (path: string) => location.pathname === path;

  // Check if user has permission to logout (admin, account owner, branch manager)
  const canLogout = () => {
    const userRole = config?.user_role?.toLowerCase();
    return userRole === 'admin' || userRole === 'account_owner' || userRole === 'branch_manager';
  };

  return (
    <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white shadow-lg border-b border-gray-700">
      <div className="px-4 h-12 flex items-center justify-between">
        {/* Left side - App name and menu */}
        <div className="flex items-center space-x-4">
          {/* App Icon */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="font-semibold text-sm">{t('app.name')}</span>
          </div>

          {/* Menu Items */}
          <div className="flex items-center space-x-1">
            {/* POS */}
            <button
              onClick={() => handleNavigate('/pos')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isCurrentPath('/pos')
                  ? 'bg-white/20 text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {t('nav.pos')}
            </button>

            {/* Lock Screen Button - Separate */}
            <button
              onClick={handleLockScreen}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-300 hover:bg-white/10 hover:text-white flex items-center space-x-1.5"
              title={t('nav.lockScreen')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>{t('nav.lockScreen')}</span>
            </button>

            {/* Settings Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                  showSettingsMenu || isCurrentPath('/sync') || isCurrentPath('/settings')
                    ? 'bg-white/20 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{t('nav.menu')}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showSettingsMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showSettingsMenu && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                  {/* Sync Status */}
                  <button
                    onClick={() => handleNavigate('/sync')}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>{t('nav.sync')}</span>
                    </div>
                    {queuedSalesCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                        {queuedSalesCount > 99 ? '99+' : queuedSalesCount}
                      </span>
                    )}
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => handleNavigate('/settings')}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{t('nav.settings')}</span>
                  </button>

                  {/* Logout (only for admin, account owner, branch manager) */}
                  {canLogout() && (
                    <>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => handleNavigate('/settings')}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>{t('settings.logout')}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Status indicators */}
        <div className="flex items-center space-x-4">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span className="uppercase">{i18n.language}</span>
          </button>

          {/* Connection Status */}
          <ConnectionIndicator />

          {/* Current Time */}
          <CurrentTime />

          {/* User Info */}
          {config?.user_name && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-md">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                {config.user_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{config.user_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Connection Indicator Component
function ConnectionIndicator() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
      isOnline ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
    }`}>
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'} ${isOnline ? 'animate-pulse' : ''}`}></div>
      <span>{isOnline ? t('sync.online') : t('sync.offline')}</span>
    </div>
  );
}

// Current Time Component
function CurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-xs font-medium">
      <span>{time.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}</span>
      <span className="mx-1 text-gray-500">•</span>
      <span className="text-gray-400">{time.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit' })}</span>
    </div>
  );
}
