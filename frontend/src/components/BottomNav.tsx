import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/components/Sidebar';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

// Calculate primary and secondary items
// Primary: Dashboard, Transactions, Accounts, Budget (First 4)
// Secondary: Savings, Debts, Settings (Rest)
const PRIMARY_ITEMS_COUNT = 4;

export const BottomNav = () => {
    const location = useLocation();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const primaryItems = NAV_ITEMS.slice(0, PRIMARY_ITEMS_COUNT);
    const secondaryItems = NAV_ITEMS.slice(PRIMARY_ITEMS_COUNT);

    const isSecondaryActive = secondaryItems.some(item => location.pathname === item.href);

    // Haptic feedback helper
    const vibrate = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-50 pt-2 px-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-around h-14 max-w-md mx-auto">
                {/* Primary Items */}
                {primaryItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => vibrate()}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl transition-all duration-300 outline-none relative group",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground active:scale-95"
                            )}
                        >
                            <div className={cn(
                                "p-1.5 rounded-xl transition-all duration-300 relative",
                                isActive ? "bg-primary/10 shadow-sm ring-1 ring-primary/20" : ""
                            )}>
                                <item.icon className={cn("h-5 w-5 transition-all duration-300", isActive ? "fill-primary/20 drop-shadow-[0_0_8px_rgba(var(--primary),0.6)]" : "group-hover:text-primary group-hover:-translate-y-0.5")} />
                            </div>
                            <span className="text-[10px] font-medium leading-none">{t(item.label)}</span>
                        </Link>
                    );
                })}

                {/* Menu Item (Drawer Trigger) */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <button
                            onClick={() => vibrate()}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl transition-all duration-300 outline-none relative group",
                                isOpen || isSecondaryActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground active:scale-95"
                            )}
                        >
                            <div className={cn(
                                "p-1.5 rounded-xl transition-all duration-300 relative",
                                (isOpen || isSecondaryActive) ? "bg-primary/10 shadow-sm ring-1 ring-primary/20" : ""
                            )}>
                                <Menu className={cn("h-5 w-5 transition-all duration-300", (isOpen || isSecondaryActive) ? "drop-shadow-[0_0_8px_rgba(var(--primary),0.6)]" : "group-hover:text-primary group-hover:-translate-y-0.5")} />
                            </div>
                            <span className="text-[10px] font-medium leading-none">{t('nav.menu')}</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-[2rem] pt-6 pb-safe px-6 border-t-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] focus:outline-none ring-0 outline-none">
                        <SheetHeader className="mb-6 text-left">
                            <SheetTitle className="text-lg font-bold flex items-center gap-2">
                                <Menu className="w-5 h-5 text-primary" />
                                {t('nav.menu')}
                            </SheetTitle>
                        </SheetHeader>
                        <div className="grid grid-cols-4 gap-4">
                            {secondaryItems.map((item) => {
                                const isActive = location.pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        onClick={() => {
                                            vibrate();
                                            setIsOpen(false);
                                        }}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className={cn(
                                            "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                                            isActive
                                                ? "bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm"
                                                : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                                        )}>
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium text-center leading-tight",
                                            isActive ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            {t(item.label)}
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>
                        <div className="mt-8 pt-6 border-t border-border flex justify-center">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
};
