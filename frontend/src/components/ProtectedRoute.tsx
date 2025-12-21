import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export const ProtectedRoute = () => {
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
