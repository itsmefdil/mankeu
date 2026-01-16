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
    account_id?: number;
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

export interface SavingTransaction {
    id: number;
    saving_id: number;
    type: 'deposit' | 'withdraw';
    amount: number;
    notes?: string;
    transaction_date: string;
    created_at: string;
}

export interface Income {
    id: number;
    source: string;
    amount: number;
    income_date: string;
}

export interface Debt {
    id: number;
    user_id: number;
    type: 'payable' | 'receivable';
    person_name: string;
    description?: string;
    amount: number;
    remaining_amount: number;
    due_date?: string;
    is_paid: boolean;
    created_at: string;
}

export interface DebtPayment {
    id: number;
    debt_id: number;
    amount: number;
    payment_date: string;
    notes?: string;
    created_at: string;
}

export interface DebtWithPayments extends Debt {
    payments: DebtPayment[];
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
    },

    depositToSaving: async (id: number, amount: number, accountId: number, categoryId: number, notes?: string, date?: string): Promise<Saving> => {
        const response = await api.post(`/savings/${id}/deposit`, { amount, account_id: accountId, category_id: categoryId, notes, date });
        return response.data;
    },

    withdrawFromSaving: async (id: number, amount: number, accountId: number, categoryId: number, notes?: string, date?: string): Promise<Saving> => {
        const response = await api.post(`/savings/${id}/withdraw`, { amount, account_id: accountId, category_id: categoryId, notes, date });
        return response.data;
    },

    getSavingTransactions: async (id: number): Promise<SavingTransaction[]> => {
        const response = await api.get(`/savings/${id}/transactions`);
        return response.data;
    },

    // Debt CRUD
    getDebts: async (type?: 'payable' | 'receivable'): Promise<Debt[]> => {
        const params = type ? `?type=${type}` : '';
        const response = await api.get(`/debts/${params}`);
        return response.data;
    },

    getDebt: async (id: number): Promise<DebtWithPayments> => {
        const response = await api.get(`/debts/${id}`);
        return response.data;
    },

    createDebt: async (data: Partial<Debt>): Promise<Debt> => {
        const response = await api.post('/debts/', data);
        return response.data;
    },

    updateDebt: async (id: number, data: Partial<Debt>): Promise<Debt> => {
        const response = await api.put(`/debts/${id}`, data);
        return response.data;
    },

    deleteDebt: async (id: number): Promise<void> => {
        await api.delete(`/debts/${id}`);
    },

    toggleDebtPaid: async (id: number): Promise<Debt> => {
        const response = await api.patch(`/debts/${id}/toggle-paid`);
        return response.data;
    },

    // Debt Payments
    getDebtPayments: async (debtId: number): Promise<DebtPayment[]> => {
        const response = await api.get(`/debts/${debtId}/payments`);
        return response.data;
    },

    addDebtPayment: async (debtId: number, data: Partial<DebtPayment>): Promise<DebtPayment> => {
        const response = await api.post(`/debts/${debtId}/payments`, data);
        return response.data;
    },

    deleteDebtPayment: async (debtId: number, paymentId: number): Promise<void> => {
        await api.delete(`/debts/${debtId}/payments/${paymentId}`);
    },

    // Accounts
    getAccounts: async (): Promise<Account[]> => {
        const response = await api.get('/accounts/');
        return response.data;
    },

    createAccount: async (data: Partial<Account>): Promise<Account> => {
        const response = await api.post('/accounts/', data);
        return response.data;
    },

    updateAccount: async (id: number, data: Partial<Account>): Promise<Account> => {
        const response = await api.put(`/accounts/${id}`, data);
        return response.data;
    },

    deleteAccount: async (id: number): Promise<void> => {
        await api.delete(`/accounts/${id}`);
    },

    // Transfers
    getTransfers: async (): Promise<Transfer[]> => {
        const response = await api.get('/transfers/');
        return response.data;
    },

    createTransfer: async (data: Partial<Transfer>): Promise<void> => {
        await api.post('/transfers/', data);
    }
};

export interface Account {
    id: number;
    user_id: number;
    name: string;
    type: 'cash' | 'bank' | 'ewallet';
    balance: number;
    is_default: boolean;
    created_at: string;
}

export interface Transfer {
    id: number;
    user_id: number;
    from_account_id: number;
    to_account_id: number;
    amount: number;
    notes?: string;
    date: string;
    created_at: string;
    from_account_name?: string;
    to_account_name?: string;
}
