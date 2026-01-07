import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export const ProtectedRoute = () => {
    const { isAuthenticated, isLoading, checkAuth, error } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (error === 'Connection failed') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
                <div className="text-xl font-semibold mb-2">Connection Error</div>
                <p className="text-muted-foreground mb-4 text-center">
                    Unable to verify your session. Please check your connection.
                </p>
                <button
                    onClick={() => checkAuth()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
