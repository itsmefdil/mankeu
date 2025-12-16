import api from '@/lib/axios';

export interface User {
    id: number;
    email: string;
    name: string;
    created_at: string;
}

export const authService = {
    login: async (username: string, password: string): Promise<{ access_token: string; token_type: string }> => {
        // OAuth2PasswordRequestForm expects form-urlencoded data
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    },

    register: async (data: { email: string; password: string; name: string }): Promise<User> => {
        const response = await api.post('/users/register', data);
        return response.data;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await api.get('/users/me');
        return response.data;
    },
};
