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

export const updateApiBaseUrl = (url: string) => {
    localStorage.setItem('api_url', url);
    api.defaults.baseURL = url;
};

// Request interceptor to ensure the latest URL is used if it wasn't updated in defaults
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        const customUrl = localStorage.getItem('api_url');

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
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            // window.location.href = '/login'; // Optional: Redirect to login
        }
        return Promise.reject(error);
    }
);

export default api;
