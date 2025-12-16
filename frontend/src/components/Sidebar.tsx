import { Link, useLocation } from 'react-router-dom';
import { ArrowRightLeft, Settings, Tags, LayoutGrid, PlusCircle, PieChart, Coins, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutGrid, href: '/' },
    { label: 'Transactions', icon: ArrowRightLeft, href: '/transactions' },
    { label: 'Analytics', icon: PieChart, href: '/analytics' },
    { label: 'Categories', icon: Tags, href: '/categories' },
    { label: 'Budget & Goals', icon: Target, href: '/budget' },
    { label: 'Settings', icon: Settings, href: '/settings' },
];

export const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
    const location = useLocation();

    return (
        <div className="flex flex-col h-full">
            <div className="flex h-16 items-center border-b border-slate-200 dark:border-slate-700 px-6">
                <Link className="flex items-center gap-3 group" to="/" onClick={onNavigate}>
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 ring-1 ring-primary/20">
                        <Coins className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="block font-display font-bold text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Mankeu</span>
                        <span className="block text-[0.65rem] text-muted-foreground uppercase tracking-widest font-medium">Finance</span>
                    </div>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-6 px-3">
                <nav className="grid items-start gap-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                    isActive
                                        ? "bg-primary/10 dark:bg-primary/10 text-foreground shadow-sm border border-primary/20"
                                        : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "text-muted-foreground group-hover:text-foreground")} />
                                {item.label}
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <Button className="w-full gap-2 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 bg-gradient-to-r from-primary to-violet-600 border border-white/20" size="lg" asChild>
                    <Link to="/transactions" onClick={onNavigate}>
                        <PlusCircle className="h-4 w-4" /> <span>Add Transaction</span>
                    </Link>
                </Button>
            </div>
        </div>
    );
};

export const Sidebar = () => {
    return (
        <aside className="hidden border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 md:flex md:w-64 md:flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300 shadow-sm">
            <SidebarContent />
        </aside>
    );
};
