import axios from 'axios';

const getBaseUrl = () => {
    return localStorage.getItem('api_url') || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

export const updateApiBaseUrl = async (url: string) => {
    await Preferences.set({ key: 'api_url', value: url });
    api.defaults.baseURL = url;
};

import { Preferences } from '@capacitor/preferences';

// Request interceptor to ensure the latest URL is used if it wasn't updated in defaults
api.interceptors.request.use(
    async (config) => {
        const { value: token } = await Preferences.get({ key: 'token' });
        const { value: customUrl } = await Preferences.get({ key: 'api_url' });

        // If there's a custom URL and it differs from the current baseURL (and isn't relative), use it
        // Note: Changing baseURL in interceptor might be tricky, so we rely on defaults.baseURL
        // But we can check if it needs update
        if (customUrl && api.defaults.baseURL !== customUrl) {
            api.defaults.baseURL = customUrl;
            config.baseURL = customUrl;
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    async (response) => {
        const newToken = response.headers['x-new-token'];
        if (newToken) {
            await Preferences.set({ key: 'token', value: newToken });
        }
        return response;
    },
    async (error) => {
        if (error.response?.status === 401) {
            await Preferences.remove({ key: 'token' });
            // window.location.href = '/login'; // Optional: Redirect to login
        }
        return Promise.reject(error);
    }
);

export default api;
