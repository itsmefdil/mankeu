import api from '@/lib/axios';
import type { User } from './auth';

export interface UserUpdateData {
    name?: string;
    password?: string;
    locale?: string;
    currency?: string;
}

export const userService = {
    updateProfile: async (data: UserUpdateData): Promise<User> => {
        const response = await api.put('/users/me', data);
        return response.data;
    },
};
