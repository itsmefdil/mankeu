import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/lib/i18n';
import { userService } from '@/services/user';
import { useAuthStore } from './useAuth';

interface PreferencesState {
    isAmountHidden: boolean;
    currency: string;
    language: string;
    toggleAmountVisibility: () => void;
    setCurrency: (currency: string) => Promise<void>;
    setLanguage: (language: string) => Promise<void>;
    syncWithUser: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            isAmountHidden: false,
            currency: 'IDR',
            language: 'id',
            toggleAmountVisibility: () => set((state) => ({ isAmountHidden: !state.isAmountHidden })),

            setCurrency: async (currency) => {
                set({ currency });
                // If logged in, save to DB
                const { isAuthenticated } = useAuthStore.getState();
                if (isAuthenticated) {
                    try {
                        await userService.updateProfile({ currency });
                    } catch (error) {
                        console.error('Failed to save currency preference', error);
                    }
                }
            },

            setLanguage: async (language) => {
                set({ language });
                i18n.changeLanguage(language);
                // If logged in, save to DB
                const { isAuthenticated } = useAuthStore.getState();
                if (isAuthenticated) {
                    try {
                        await userService.updateProfile({ locale: language });
                    } catch (error) {
                        console.error('Failed to save language preference', error);
                    }
                }
            },

            syncWithUser: () => {
                const { user } = useAuthStore.getState();
                if (user) {
                    if (user.currency) set({ currency: user.currency });
                    if (user.locale) {
                        set({ language: user.locale });
                        i18n.changeLanguage(user.locale);
                    }
                }
            }
        }),
        {
            name: 'user-preferences',
            onRehydrateStorage: () => (state) => {
                // Restore i18n language on hydration
                if (state && state.language) {
                    i18n.changeLanguage(state.language);
                }
            }
        }
    )
);

