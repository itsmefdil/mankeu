import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

export const BackButtonHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const locationRef = useRef(location);

    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    useEffect(() => {
        const handleBackButton = async () => {
            const currentPath = locationRef.current.pathname;
            const rootPaths = ['/', '/login', '/server-config'];

            if (rootPaths.includes(currentPath)) {
                await CapacitorApp.exitApp();
            } else {
                navigate(-1);
            }
        };

        let listenerHandle: any = null;

        const setupListener = async () => {
            try {
                listenerHandle = await CapacitorApp.addListener('backButton', handleBackButton);
            } catch (error) {
                console.error('Failed to setup back button listener:', error);
            }
        };

        setupListener();

        return () => {
            if (listenerHandle?.remove) {
                listenerHandle.remove();
            } else {
                CapacitorApp.removeAllListeners();
            }
        };
    }, [navigate]);

    return null;
};
