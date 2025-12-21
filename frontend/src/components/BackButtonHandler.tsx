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
            // Check current path using the ref
            if (locationRef.current.pathname === '/') {
                await CapacitorApp.exitApp();
            } else {
                navigate('/');
            }
        };

        const setupListener = async () => {
            try {
                // Remove any existing listeners first to prevent duplicates
                await CapacitorApp.removeAllListeners();
                await CapacitorApp.addListener('backButton', handleBackButton);
            } catch (error) {
                console.error('Failed to setup back button listener:', error);
            }
        };

        setupListener();

        return () => {
            // Cleanup on unmount
            CapacitorApp.removeAllListeners();
        };
    }, [navigate]);

    return null;
};
