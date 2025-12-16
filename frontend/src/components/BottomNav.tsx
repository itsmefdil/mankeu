import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/components/Sidebar';

export const BottomNav = () => {
    const location = useLocation();

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-50 pt-2 px-6 pb-[env(safe-area-inset-bottom,20px)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between gap-1 h-14 max-w-sm mx-auto">
                {NAV_ITEMS.slice(0, 5).map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all duration-300 outline-none relative group",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground active:scale-95"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-xl transition-all duration-300 relative",
                                isActive ? "bg-primary/10 shadow-sm ring-1 ring-primary/20" : ""
                            )}>
                                <item.icon className={cn("h-5 w-5 transition-all duration-300", isActive ? "fill-primary/20 drop-shadow-[0_0_8px_rgba(var(--primary),0.6)]" : "group-hover:text-primary group-hover:-translate-y-0.5")} />
                                {isActive && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_4px_currentColor]"></span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
