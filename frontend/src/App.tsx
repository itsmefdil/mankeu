import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { checkBackendConnection } from '@/services/health';
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
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useState } from 'react';

const queryClient = new QueryClient();



const App = () => {
  useTheme(); // Initialize theme on app load
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    // Check if we need to configure server
    const checkConnection = async () => {
      // 1. Strict check: If no URL in localStorage, force config
      // We ignore environment variables to enforce the 'setup first' flow
      const storedUrl = localStorage.getItem('api_url');

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
        // If connection fails and we are not on config page, redirect
        // This ensures "broken" apps don't get stuck on a loading screen
        if (window.location.pathname !== '/server-config') {
          // Only redirect if it's a critical failure (like 404 or network error), 401 is fine (needs login)
          // simplified: just redirect for now as "server first" implies we need a working server
          window.location.replace('/server-config');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
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
