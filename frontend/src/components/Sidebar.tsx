import { Link, useLocation } from 'react-router-dom';
import { ArrowRightLeft, Settings, LayoutGrid, PlusCircle, Coins, Target, CreditCard, PiggyBank, Wallet, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export const NAV_ITEMS = [
    { label: 'nav.dashboard', icon: LayoutGrid, href: '/' },
    { label: 'nav.accounts', icon: Wallet, href: '/accounts' },
    { label: 'nav.transactions', icon: ArrowRightLeft, href: '/transactions' },
    { label: 'nav.budget_only', icon: Target, href: '/budget' },
    { label: 'nav.savings', icon: PiggyBank, href: '/savings' },
    { label: 'nav.analytics', icon: BarChart3, href: '/analytics' },
    { label: 'nav.debts', icon: CreditCard, href: '/debts' },
    { label: 'nav.settings', icon: Settings, href: '/settings' },
];

export const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
    const location = useLocation();
    const { t } = useTranslation();

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex h-20 items-center px-6">
                <Link className="flex items-center gap-3 group" to="/" onClick={onNavigate}>
                    <div className="h-11 w-11 rounded-2xl bg-background shadow-neu-extruded-sm flex items-center justify-center text-primary group-hover:shadow-neu-extruded-hover transition-all duration-300">
                        <Coins className="h-6 w-6" />
                    </div>
                    <div>
                        <span className="block font-display font-extrabold text-xl tracking-tight text-foreground">Mankeu</span>
                        <span className="block text-[0.65rem] text-muted-foreground uppercase tracking-widest font-semibold">{t('nav.finance')}</span>
                    </div>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
                <nav className="grid items-start gap-2.5">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    "group flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 outline-none select-none",
                                    isActive
                                        ? "bg-background shadow-neu-inset text-primary font-semibold dark:shadow-neu-dark-inset"
                                        : "text-muted-foreground hover:text-foreground hover:shadow-neu-extruded-sm dark:hover:shadow-neu-dark-extruded-sm"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-xl transition-all duration-300",
                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )}>
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <span>{t(item.label)}</span>
                                {isActive && (
                                    <div className="ml-auto w-2 h-2 rounded-full bg-primary shadow-neu-extruded-sm" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="p-5">
                <Button className="w-full gap-2 text-base font-semibold" size="lg" asChild>
                    <Link to="/transactions/new" onClick={onNavigate}>
                        <PlusCircle className="h-5 w-5" /> <span>{t('nav.add_transaction')}</span>
                    </Link>
                </Button>
            </div>
        </div>
    );
};

export const Sidebar = () => {
    return (
        <aside className="hidden bg-background md:flex md:w-64 md:flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300 shadow-neu-extruded dark:shadow-neu-dark-extruded pt-safe pb-safe border-r border-transparent">
            <SidebarContent />
        </aside>
    );
};
