import api from '@/lib/axios';

export const checkBackendConnection = async (url?: string) => {
    try {
        const config = url ? { baseURL: url } : {};
        const response = await api.get('/health/connection', config);
        console.log('Backend connection validated:', response.data);
        return response.data;
    } catch (error) {
        console.error('Backend connection check failed:', error);
        throw error;
    }
};
