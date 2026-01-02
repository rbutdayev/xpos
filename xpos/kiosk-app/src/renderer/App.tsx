import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useConfigStore } from '../stores/config-store';
import Setup from './pages/Setup';
import POS from './pages/POS';
import SyncStatus from './pages/SyncStatus';
import Settings from './pages/Settings';
import Navigation from './components/Navigation';

function App() {
  const { config, setConfig, setLoading } = useConfigStore();

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
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const isRegistered = config?.is_registered || false;

  return (
    <Router>
      <div className="app min-h-screen bg-gray-50">
        {isRegistered && <Navigation />}

        <Routes>
          {/* Setup Route - Only accessible when not registered */}
          <Route
            path="/setup"
            element={!isRegistered ? <Setup /> : <Navigate to="/pos" replace />}
          />

          {/* Protected Routes - Only accessible when registered */}
          <Route
            path="/pos"
            element={isRegistered ? <POS /> : <Navigate to="/setup" replace />}
          />
          <Route
            path="/sync"
            element={isRegistered ? <SyncStatus /> : <Navigate to="/setup" replace />}
          />
          <Route
            path="/settings"
            element={isRegistered ? <Settings /> : <Navigate to="/setup" replace />}
          />

          {/* Default redirect */}
          <Route
            path="/"
            element={<Navigate to={isRegistered ? '/pos' : '/setup'} replace />}
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
