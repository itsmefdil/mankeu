import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, ArrowRightLeft, Plus, Target, User } from 'lucide-react';

export const BottomNav = () => {
    const location = useLocation();
    const { t } = useTranslation();

    const vibrate = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background z-50 pt-2 px-3 pb-safe shadow-neu-extruded dark:shadow-neu-dark-extruded rounded-t-[32px]">
            <div className="flex items-center justify-between h-16 w-full relative px-2">
                {/* 1. Home */}
                <Link
                    to="/"
                    onClick={() => vibrate()}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all duration-300 outline-none select-none",
                        location.pathname === '/' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className={cn(
                        "p-1.5 rounded-xl transition-all duration-300",
                        location.pathname === '/' ? "bg-background shadow-neu-inset dark:shadow-neu-dark-inset text-primary" : ""
                    )}>
                        <LayoutGrid className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-semibold leading-none">{t('nav.dashboard')}</span>
                </Link>

                {/* 2. Transactions */}
                <Link
                    to="/transactions"
                    onClick={() => vibrate()}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all duration-300 outline-none select-none",
                        location.pathname === '/transactions' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className={cn(
                        "p-1.5 rounded-xl transition-all duration-300",
                        location.pathname === '/transactions' ? "bg-background shadow-neu-inset dark:shadow-neu-dark-inset text-primary" : ""
                    )}>
                        <ArrowRightLeft className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-semibold leading-none">{t('nav.transactions')}</span>
                </Link>

                {/* 3. Center Elevated Plus Button */}
                <div className="flex flex-col items-center justify-center -mt-6">
                    <Link
                        to="/transactions/new"
                        onClick={() => vibrate()}
                        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-neu-extruded hover:shadow-neu-extruded-hover active:translate-y-0.5 active:shadow-neu-inset-sm transition-all duration-300 flex items-center justify-center select-none"
                        title={t('nav.add_transaction') || 'Tambah Transaksi'}
                    >
                        <Plus className="h-7 w-7 stroke-[2.5]" />
                    </Link>
                </div>

                {/* 4. Budget */}
                <Link
                    to="/budget"
                    onClick={() => vibrate()}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all duration-300 outline-none select-none",
                        location.pathname === '/budget' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className={cn(
                        "p-1.5 rounded-xl transition-all duration-300",
                        location.pathname === '/budget' ? "bg-background shadow-neu-inset dark:shadow-neu-dark-inset text-primary" : ""
                    )}>
                        <Target className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-semibold leading-none">{t('nav.budget_only')}</span>
                </Link>

                {/* 5. Profile */}
                <Link
                    to="/profile"
                    onClick={() => vibrate()}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all duration-300 outline-none select-none",
                        location.pathname === '/profile' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className={cn(
                        "p-1.5 rounded-xl transition-all duration-300",
                        location.pathname === '/profile' ? "bg-background shadow-neu-inset dark:shadow-neu-dark-inset text-primary" : ""
                    )}>
                        <User className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-semibold leading-none">{t('nav.profile') || 'Profil'}</span>
                </Link>
            </div>
        </div>
    );
};
