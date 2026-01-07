import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ConnectionErrorDialog } from '@/components/ConnectionErrorDialog';

export const ProtectedRoute = () => {
    const { isAuthenticated, isLoading, checkAuth, error } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (error === 'Connection failed') {
        return <ConnectionErrorDialog />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
