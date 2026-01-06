import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useConfigStore } from '../stores/config-store';
import Setup from './pages/Setup';
import PinLogin from './pages/PinLogin';
import POS from './pages/POS';
import SyncStatus from './pages/SyncStatus';
import Settings from './pages/Settings';
import LockScreen from './pages/LockScreen';
import TopMenuBar from './components/TopMenuBar';

function App() {
  const { config, setConfig, setLoading, loadTaxRate, isLocked, lockScreen, unlockScreen } = useConfigStore();

  useEffect(() => {
    // Load config on app start
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const storedConfig = await window.ipc.getConfig();
      if (storedConfig && storedConfig.is_registered) {
        setConfig(storedConfig);
        // Load tax rate from fiscal config after config is loaded
        await loadTaxRate();
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const isRegistered = config?.is_registered || false;
  const isLoggedIn = config?.is_logged_in || false;

  // If screen is locked, show lock screen
  if (isRegistered && isLoggedIn && isLocked) {
    return <LockScreen onUnlock={unlockScreen} />;
  }

  return (
    <Router>
      <div className="app min-h-screen bg-gray-50">
        {isRegistered && isLoggedIn && <TopMenuBar onLockScreen={lockScreen} />}

        <Routes>
          {/* Setup Route - Only accessible when not registered */}
          <Route
            path="/setup"
            element={!isRegistered ? <Setup /> : <Navigate to={isLoggedIn ? '/pos' : '/login'} replace />}
          />

          {/* PIN Login Route - Only accessible when registered but not logged in */}
          <Route
            path="/login"
            element={
              isRegistered && !isLoggedIn ? (
                <PinLogin />
              ) : isRegistered && isLoggedIn ? (
                <Navigate to="/pos" replace />
              ) : (
                <Navigate to="/setup" replace />
              )
            }
          />

          {/* Protected Routes - Only accessible when registered AND logged in */}
          <Route
            path="/pos"
            element={
              isRegistered && isLoggedIn ? (
                <POS />
              ) : isRegistered ? (
                <Navigate to="/login" replace />
              ) : (
                <Navigate to="/setup" replace />
              )
            }
          />
          <Route
            path="/sync"
            element={
              isRegistered && isLoggedIn ? (
                <SyncStatus />
              ) : isRegistered ? (
                <Navigate to="/login" replace />
              ) : (
                <Navigate to="/setup" replace />
              )
            }
          />
          <Route
            path="/settings"
            element={
              isRegistered && isLoggedIn ? (
                <Settings />
              ) : isRegistered ? (
                <Navigate to="/login" replace />
              ) : (
                <Navigate to="/setup" replace />
              )
            }
          />

          {/* Default redirect */}
          <Route
            path="/"
            element={
              <Navigate
                to={isRegistered ? (isLoggedIn ? '/pos' : '/login') : '/setup'}
                replace
              />
            }
          />
        </Routes>

        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              fontSize: '16px',
              padding: '16px',
              borderRadius: '8px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
