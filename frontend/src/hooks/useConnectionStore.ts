import { create } from 'zustand';

interface ConnectionStore {
    isConnectionError: boolean;
    setConnectionError: (error: boolean) => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
    isConnectionError: false,
    setConnectionError: (error) => set({ isConnectionError: error }),
}));
