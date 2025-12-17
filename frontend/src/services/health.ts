import api from '@/lib/axios';

export const checkBackendConnection = async () => {
    try {
        const response = await api.get('/health/connection');
        console.log('Backend connection validated:', response.data);
        return response.data;
    } catch (error) {
        console.error('Backend connection check failed:', error);
        throw error;
    }
};
