import { useEffect, useState } from 'react';
import { Search, Sun, Moon, LogOut, Settings, Coins, Eye, EyeOff, LayoutGrid, Wallet, ArrowRightLeft, Target, PiggyBank, BarChart3, CreditCard, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { usePreferencesStore } from '@/hooks/usePreferences';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const TopBar = () => {
    const { user, logout } = useAuthStore();
    const { toggleTheme } = useTheme();
    const { isAmountHidden, toggleAmountVisibility } = usePreferencesStore();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isCommandOpen, setIsCommandOpen] = useState(false);

    useEffect(() => {
        const down = (event: KeyboardEvent) => {
            const isK = event.key.toLowerCase() === 'k';
            if (!isK || !(event.metaKey || event.ctrlKey)) return;
            if (window.innerWidth < 768) return;

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
                <div className="flex h-16 md:h-20 items-center justify-between gap-3 px-4 md:px-8">
                    <div className="flex-1 min-w-0">
                        {/* Mobile: Clean Brand */}
                        <div className="md:hidden flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-2xl bg-background shadow-neu-extruded-sm flex items-center justify-center text-primary shrink-0">
                                <Coins className="h-5 w-5" />
                            </div>
                            <span className="font-display font-black text-xl tracking-tight text-foreground">
                                Mankeu
                            </span>
                        </div>

                        {/* Desktop: Command Search */}
                        <form onSubmit={(e) => e.preventDefault()} className="hidden md:block">
                            <div className="relative group max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <button
                                    type="button"
                                    onClick={() => setIsCommandOpen(true)}
                                    className="w-full bg-background shadow-neu-inset dark:shadow-neu-dark-inset rounded-2xl pl-11 pr-16 py-2.5 text-left text-sm text-muted-foreground hover:shadow-neu-inset-deep dark:hover:shadow-neu-dark-inset-deep focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-300"
                                >
                                    {t('nav.search_placeholder')}
                                </button>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                                    <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded-xl bg-background shadow-neu-extruded-sm px-2 font-mono text-[10px] font-semibold text-muted-foreground">
                                        <span className="text-xs">⌘</span>K
                                    </kbd>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={toggleAmountVisibility}
                            className="h-10 w-10 rounded-2xl bg-background text-foreground shadow-neu-extruded-sm hover:shadow-neu-extruded-hover active:shadow-neu-inset-sm active:translate-y-0.5 transition-all duration-200 flex items-center justify-center select-none"
                            title={isAmountHidden ? "Tampilkan nominal" : "Sembunyikan nominal"}
                        >
                            {isAmountHidden ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-primary" />}
                        </button>

                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="h-10 w-10 rounded-2xl bg-background text-foreground shadow-neu-extruded-sm hover:shadow-neu-extruded-hover active:shadow-neu-inset-sm active:translate-y-0.5 transition-all duration-200 flex items-center justify-center select-none"
                            title="Ganti tema"
                        >
                            <Sun className="h-4 w-4 text-amber-500 dark:hidden" />
                            <Moon className="h-4 w-4 text-primary hidden dark:block" />
                        </button>

                        <div className="hidden sm:block">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        className="rounded-2xl pl-2 pr-4 gap-3 h-11 group outline-none select-none"
                                    >
                                        <div className="h-8 w-8 rounded-xl overflow-hidden shadow-neu-inset-sm flex items-center justify-center bg-background shrink-0">
                                            {user?.picture ? (
                                                <img src={user.picture} alt={user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-base">🤠</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-sm font-semibold leading-none text-foreground group-hover:text-primary transition-colors">{user?.name || 'Guest'}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Pro Plan</span>
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal p-3">
                                        <div className="flex items-center gap-3">
                                            {user?.picture && (
                                                <div className="h-9 w-9 rounded-2xl overflow-hidden shadow-neu-inset-sm shrink-0">
                                                    <img src={user.picture} alt={user.name} className="h-full w-full object-cover" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold leading-tight truncate text-foreground">{user?.name}</p>
                                                <p className="text-xs leading-tight text-muted-foreground truncate">{user?.email}</p>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link to="/profile" className="cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>{t('nav.profile') || 'Profile'}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/settings" className="cursor-pointer">
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>{t('nav.settings')}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>{t('nav.logout')}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
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
