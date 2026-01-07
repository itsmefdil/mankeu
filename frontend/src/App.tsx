import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { checkBackendConnection } from '@/services/health';
import { Preferences } from '@capacitor/preferences';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '@/pages/Dashboard';
import TransactionsPage from '@/pages/Transactions';
import CategoriesPage from '@/pages/Categories';
import BudgetPage from '@/pages/Budget';
import AnalyticsPage from '@/pages/Analytics';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { BackButtonHandler } from '@/components/BackButtonHandler';
import SettingsPage from '@/pages/Settings';
import ServerConfig from '@/pages/ServerConfig';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/hooks/useAuth';
import { usePreferencesStore } from '@/hooks/usePreferences';

const queryClient = new QueryClient();



import { ConnectionErrorDialog } from '@/components/ConnectionErrorDialog';

const App = () => {
  useTheme(); // Initialize theme on app load

  useEffect(() => {

    // Check if we need to configure server
    const checkConnection = async () => {
      // 1. Strict check: If no URL in localStorage, force config
      // We ignore environment variables to enforce the 'setup first' flow
      const { value: storedUrl } = await Preferences.get({ key: 'api_url' });

      if (!storedUrl) {
        if (window.location.pathname !== '/server-config') {
          window.location.replace('/server-config');
        }
        return;
      }

      // 2. Validate connection
      try {
        await checkBackendConnection();
        console.log('Successfully connected to backend');
      } catch (err) {
        console.error('Failed to connect to backend', err);
        // We do NOT redirect here relative to the previous behavior.
        // If the server is down, the user might still be logged in locally or we want to show a proper error screen
        // instead of forcing re-configuration.
      }
    };

    checkConnection();
    checkConnection();
  }, []);

  const { user } = useAuthStore();
  const { syncWithUser } = usePreferencesStore();

  useEffect(() => {
    if (user) {
      syncWithUser();
    }
  }, [user, syncWithUser]);


  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ConnectionErrorDialog />
        <BackButtonHandler />
        <Routes>
          <Route path="/server-config" element={<ServerConfig />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/goals" element={<Navigate to="/budget" replace />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
