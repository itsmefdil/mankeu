import { create } from 'zustand';
import { authService, type User } from '@/services/auth';
import { Preferences } from '@capacitor/preferences';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    error: string | null;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    login: async (email, password) => {
        try {
            const data = await authService.login(email, password);
            await Preferences.set({ key: 'token', value: data.access_token });

            const user = await authService.getCurrentUser();
            set({ user, isAuthenticated: true, error: null });
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    },

    loginWithGoogle: async (idToken: string) => {
        try {
            const data = await authService.loginWithGoogle(idToken);
            await Preferences.set({ key: 'token', value: data.access_token });

            const user = await authService.getCurrentUser();
            set({ user, isAuthenticated: true, error: null });
        } catch (error) {
            console.error('Google Login failed', error);
            throw error;
        }
    },

    register: async (name, email, password) => {
        try {
            await authService.register({ name, email, password });
            // Optionally login automatically
        } catch (error) {
            console.error('Registration failed', error);
            throw error;
        }
    },

    logout: async () => {
        await Preferences.remove({ key: 'token' });
        set({ user: null, isAuthenticated: false, error: null });
    },

    checkAuth: async () => {
        const { value: token } = await Preferences.get({ key: 'token' });
        if (!token) {
            set({ isAuthenticated: false, isLoading: false });
            return;
        }

        try {
            const user = await authService.getCurrentUser();
            set({ user, isAuthenticated: true, isLoading: false, error: null });
        } catch (error: any) {
            console.error('Check Auth Failed:', error);
            // Only wipe token if explicitly unauthorized
            if (error.response?.status === 401) {
                await Preferences.remove({ key: 'token' });
                set({ user: null, isAuthenticated: false, isLoading: false, error: null });
            } else {
                // Keep token, set error state, but don't log out
                // We keep 'user' null until we can verify it, but we don't destroy the session.
                set({
                    // user: null, // Don't nullify user immediately if we want optimistic UI (though current design is safe default)
                    isAuthenticated: true, // Optimistically keep them "authenticated" state-wise if we have a token
                    // 'protectedRoute' will see 'error' and show the connection error screen instead of redirecting.
                    isLoading: false,
                    error: 'Connection failed'
                });
            }
        }
    },
}));
