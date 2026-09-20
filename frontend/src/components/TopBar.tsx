import { useEffect, useState } from 'react';
import { Search, Sun, Moon, LogOut, Settings, Coins, Eye, EyeOff, LayoutGrid, Wallet, ArrowRightLeft, Target, PiggyBank, BarChart3, CreditCard, User } from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { usePreferencesStore } from '@/hooks/usePreferences';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandShortcut,
    CommandSeparator,
} from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const TopBar = () => {
    const { logout } = useAuthStore();
    const { toggleTheme } = useTheme();
    const { isAmountHidden, toggleAmountVisibility } = usePreferencesStore();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isCommandOpen, setIsCommandOpen] = useState(false);

    useEffect(() => {
        const down = (event: KeyboardEvent) => {
            const isK = event.key.toLowerCase() === 'k';
            if (!isK || !(event.metaKey || event.ctrlKey)) return;

            event.preventDefault();
            setIsCommandOpen((open) => !open);
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const goTo = (path: string) => {
        setIsCommandOpen(false);
        navigate(path);
    };

    return (
        <>
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md pt-safe transition-all duration-300">
                <div className="flex h-16 items-center justify-between gap-3 px-4">
                    <div className="flex-1 min-w-0">
                        {/* Clean Brand */}
                        <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-2xl bg-background shadow-neu-extruded-sm flex items-center justify-center text-primary shrink-0">
                                <Coins className="h-5 w-5" />
                            </div>
                            <span className="font-display font-black text-xl tracking-tight text-foreground">
                                Mankeu
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsCommandOpen(true)}
                            className="h-10 w-10 rounded-2xl bg-background text-foreground shadow-neu-extruded-sm hover:shadow-neu-extruded-hover active:shadow-neu-inset-sm active:translate-y-0.5 transition-all duration-200 flex items-center justify-center select-none"
                            title={t('nav.search_placeholder')}
                        >
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </button>

                        <button
                            type="button"
                            onClick={toggleAmountVisibility}
                            className="h-10 w-10 rounded-2xl bg-background text-foreground shadow-neu-extruded-sm hover:shadow-neu-extruded-hover active:shadow-neu-inset-sm active:translate-y-0.5 transition-all duration-200 flex items-center justify-center select-none"
                            title={isAmountHidden ? t('nav.show_amounts') : t('nav.hide_amounts')}
                        >
                            {isAmountHidden ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-primary" />}
                        </button>

                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="h-10 w-10 rounded-2xl bg-background text-foreground shadow-neu-extruded-sm hover:shadow-neu-extruded-hover active:shadow-neu-inset-sm active:translate-y-0.5 transition-all duration-200 flex items-center justify-center select-none"
                            title={t('nav.toggle_theme')}
                        >
                            <Sun className="h-4 w-4 text-amber-500 dark:hidden" />
                            <Moon className="h-4 w-4 text-primary hidden dark:block" />
                        </button>
                    </div>
                </div>
            </header>

            <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
                <CommandInput placeholder={`${t('nav.search_placeholder')}...`} />
                <CommandList>
                    <CommandEmpty>{t('nav.search_no_results')}</CommandEmpty>
                    <CommandGroup heading={t('nav.search_navigation')}>
                        <CommandItem onSelect={() => goTo('/')}>
                            <LayoutGrid className="mr-2 h-4 w-4" />
                            {t('nav.dashboard')}
                        </CommandItem>
                        <CommandItem onSelect={() => goTo('/accounts')}>
                            <Wallet className="mr-2 h-4 w-4" />
                            {t('nav.accounts')}
                        </CommandItem>
                        <CommandItem onSelect={() => goTo('/transactions')}>
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            {t('nav.transactions')}
                        </CommandItem>
                        <CommandItem onSelect={() => goTo('/budget')}>
                            <Target className="mr-2 h-4 w-4" />
                            {t('nav.budget_only')}
                        </CommandItem>
                        <CommandItem onSelect={() => goTo('/savings')}>
                            <PiggyBank className="mr-2 h-4 w-4" />
                            {t('nav.savings')}
                        </CommandItem>
                        <CommandItem onSelect={() => goTo('/analytics')}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            {t('nav.analytics')}
                        </CommandItem>
                        <CommandItem onSelect={() => goTo('/debts')}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {t('nav.debts')}
                        </CommandItem>
                        <CommandItem onSelect={() => goTo('/profile')}>
                            <User className="mr-2 h-4 w-4" />
                            {t('nav.profile') || 'Profile'}
                        </CommandItem>
                        <CommandItem onSelect={() => goTo('/settings')}>
                            <Settings className="mr-2 h-4 w-4" />
                            {t('nav.settings')}
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading={t('nav.search_actions')}>
                        <CommandItem onSelect={() => { toggleAmountVisibility(); setIsCommandOpen(false); }}>
                            {isAmountHidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                            {isAmountHidden ? t('nav.show_amounts') : t('nav.hide_amounts')}
                        </CommandItem>
                        <CommandItem onSelect={() => { toggleTheme(); setIsCommandOpen(false); }}>
                            <Sun className="mr-2 h-4 w-4" />
                            {t('nav.toggle_theme')}
                        </CommandItem>
                        <CommandItem onSelect={() => { setIsCommandOpen(false); logout(); }}>
                            <LogOut className="mr-2 h-4 w-4" />
                            {t('nav.logout')}
                            <CommandShortcut>⌘⇧Q</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
};
