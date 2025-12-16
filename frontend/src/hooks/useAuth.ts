import { create } from 'zustand';
import { authService, type User } from '@/services/auth';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (email, password) => {
        try {
            const data = await authService.login(email, password);
            localStorage.setItem('token', data.access_token);

            const user = await authService.getCurrentUser();
            set({ user, isAuthenticated: true });
        } catch (error) {
            console.error('Login failed', error);
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

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ isAuthenticated: false, isLoading: false });
            return;
        }

        try {
            const user = await authService.getCurrentUser();
            set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            localStorage.removeItem('token');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },
}));
