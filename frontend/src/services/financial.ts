import api from '@/lib/axios';

export interface Category {
    id: number;
    name: string;
    type: 'expense' | 'income' | 'saving';
}

export interface Transaction {
    id: number;
    user_id: number;
    category_id: number;
    name: string;
    transaction_date: string;
    amount: number;
    notes?: string;
    category?: Category; // Assuming backend might expand this or we fetch separately
    goal_id?: number;
}

export interface Budget {
    id: number;
    category_id: number;
    month: number;
    year: number;
    budget_amount: number;
    category?: Category;
}

export interface Saving {
    id: number;
    name: string;
    amount: number;
    saving_date: string;
}

export interface Income {
    id: number;
    source: string;
    amount: number;
    income_date: string;
}

export const financialService = {
    getTransactions: async (): Promise<Transaction[]> => {
        const response = await api.get('/transactions/');
        return response.data;
    },

    getBudgets: async (): Promise<Budget[]> => {
        const response = await api.get('/budgets/');
        return response.data;
    },

    getSavings: async (): Promise<Saving[]> => {
        const response = await api.get('/savings/');
        return response.data;
    },

    getIncomes: async (): Promise<Income[]> => {
        const response = await api.get('/incomes/');
        return response.data;
    },

    getCategories: async (): Promise<Category[]> => {
        const response = await api.get('/categories/');
        return response.data;
    },

    createCategory: async (data: Partial<Category>): Promise<Category> => {
        const response = await api.post('/categories/', data);
        return response.data;
    },

    updateCategory: async (id: number, data: Partial<Category>): Promise<Category> => {
        const response = await api.put(`/categories/${id}`, data);
        return response.data;
    },

    deleteCategory: async (id: number): Promise<void> => {
        await api.delete(`/categories/${id}`);
    },

    // Transaction CRUD
    createTransaction: async (data: Partial<Transaction>): Promise<Transaction> => {
        const response = await api.post('/transactions/', data);
        return response.data;
    },

    updateTransaction: async (id: number, data: Partial<Transaction>): Promise<Transaction> => {
        const response = await api.put(`/transactions/${id}`, data);
        return response.data;
    },

    deleteTransaction: async (id: number): Promise<void> => {
        await api.delete(`/transactions/${id}`);
    },

    bulkDeleteTransactions: async (ids: number[]): Promise<void> => {
        await api.post('/transactions/bulk-delete', { ids });
    },

    // Budget CRUD
    createBudget: async (data: Partial<Budget>): Promise<Budget> => {
        const response = await api.post('/budgets/', data);
        return response.data;
    },

    updateBudget: async (id: number, data: Partial<Budget>): Promise<Budget> => {
        const response = await api.put(`/budgets/${id}`, data);
        return response.data;
    },

    deleteBudget: async (id: number): Promise<void> => {
        await api.delete(`/budgets/${id}`);
    },

    // Saving CRUD
    createSaving: async (data: Partial<Saving>): Promise<Saving> => {
        const response = await api.post('/savings/', data);
        return response.data;
    },

    updateSaving: async (id: number, data: Partial<Saving>): Promise<Saving> => {
        const response = await api.put(`/savings/${id}`, data);
        return response.data;
    },

    deleteSaving: async (id: number): Promise<void> => {
        await api.delete(`/savings/${id}`);
    }
};
