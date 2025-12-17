import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
    isAmountHidden: boolean;
    toggleAmountVisibility: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            isAmountHidden: false,
            toggleAmountVisibility: () => set((state) => ({ isAmountHidden: !state.isAmountHidden })),
        }),
        {
            name: 'user-preferences',
        }
    )
);
