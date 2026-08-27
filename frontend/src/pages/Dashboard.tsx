import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import {
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    ChevronDown,
    Sparkles,
    Wallet,
    CreditCard,
    Target,
    Loader2,
    BarChart3,
    PiggyBank,
    Landmark,
    PlusCircle,
    ArrowRightLeft,
    ChevronRight,
    ShieldCheck,
    AlertCircle,
    TrendingUp
} from 'lucide-react';

import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { usePreferencesStore } from '@/hooks/usePreferences';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { financialService } from '@/services/financial';
import { isBudgetActive } from '@/lib/budgetUtils';
import { useAuthStore } from '@/hooks/useAuth';

import { useTranslation } from 'react-i18next';

export default function Dashboard() {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const { isAmountHidden, language } = usePreferencesStore();
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('greeting.morning');
        if (hour < 17) return t('greeting.afternoon');
        return t('greeting.evening');
    };

    const { data: transactions, isLoading: loadingTx } = useQuery({
        queryKey: ['transactions'],
        queryFn: financialService.getTransactions
    });

    const { data: budgets, isLoading: loadingBudgets } = useQuery({
        queryKey: ['budgets'],
        queryFn: financialService.getBudgets
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: financialService.getCategories
    });

    const { data: accounts, isLoading: loadingAccounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: financialService.getAccounts
    });

    const { data: savings, isLoading: loadingSavings } = useQuery({
        queryKey: ['savings'],
        queryFn: financialService.getSavings
    });

    // --- Aggregations ---

    const totalNetWorth = useMemo(() => {
        return accounts?.reduce((acc, curr) => acc + Number(curr.balance), 0) || 0;
    }, [accounts]);

    const categoryMap = useMemo(() => {
        const map = new Map();
        categories?.forEach(c => map.set(c.id, c));
        return map;
    }, [categories]);

    // Monthly Flow Stats
    const stats = useMemo(() => {
        if (!transactions) return { income: 0, expense: 0, balance: 0 };

        let incomeSum = 0;
        let expenseSum = 0;

        transactions.forEach(tx => {
            const txDate = new Date(tx.transaction_date);
            if (txDate.getMonth() + 1 !== selectedMonth || txDate.getFullYear() !== selectedYear) return;
            if (tx.is_transfer) return;

            const cat = categoryMap.get(tx.category_id);
            if (cat?.type === 'income') {
                incomeSum += Number(tx.amount);
            } else if (cat?.type === 'expense') {
                expenseSum += Number(tx.amount);
            }
        });

        return {
            income: incomeSum,
            expense: expenseSum,
            balance: incomeSum - expenseSum
        };
    }, [transactions, selectedMonth, selectedYear, categoryMap]);

    // Overall Budget Health Pulse
    const budgetPulse = useMemo(() => {
        if (!budgets || !transactions) return { totalBudget: 0, totalSpent: 0, percent: 0, remaining: 0 };

        const currentBudgets = budgets.filter(b => isBudgetActive(b, selectedMonth, selectedYear));
        const totalBudget = currentBudgets.reduce((acc, curr) => acc + Number(curr.budget_amount), 0);

        if (totalBudget === 0) return { totalBudget: 0, totalSpent: 0, percent: 0, remaining: 0 };

        const budgetCategoryIds = new Set(currentBudgets.map(b => b.category_id));

        const totalSpent = transactions
            .filter(t => {
                const d = new Date(t.transaction_date);
                return budgetCategoryIds.has(t.category_id) && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
            })
            .reduce((acc, curr) => acc + Number(curr.amount), 0);

        const percent = Math.min((totalSpent / totalBudget) * 100, 100);
        const remaining = totalBudget - totalSpent;

        return {
            totalBudget,
            totalSpent,
            percent,
            remaining
        };
    }, [budgets, transactions, selectedMonth, selectedYear]);

    if (loadingTx || loadingBudgets || loadingAccounts || loadingSavings) {
        return (
            <DashboardLayout>
                <div className="flex h-full items-center justify-center pt-24">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-3xl bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                        <p className="text-muted-foreground font-medium animate-pulse">{t('common.loading')}</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-5 sm:gap-8 w-full px-1 sm:px-0 pb-12">
                {/* 1. Period Filter */}
                <div className="flex justify-end items-center gap-2.5">
                    <div className="relative">
                        <select
                            className="appearance-none bg-background shadow-neu-inset dark:shadow-neu-dark-inset rounded-2xl pl-4 pr-9 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-bold"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m} className="bg-background text-foreground py-2 font-medium">
                                    {new Date(0, m - 1).toLocaleString(language, { month: 'long' })}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            className="appearance-none bg-background shadow-neu-inset dark:shadow-neu-dark-inset rounded-2xl pl-4 pr-9 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-bold"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(y => (
                                <option key={y} value={y} className="bg-background text-foreground py-2 font-medium">{y}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                    </div>
                </div>

                {/* 2. Hero Vault Card (Tactile Net Worth & Monthly In/Out) */}
                <div className="p-6 sm:p-8 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Net Worth Main Display */}
                        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-background shadow-neu-inset-deep dark:shadow-neu-dark-inset-deep flex items-center justify-center text-primary shrink-0">
                                <Landmark className="h-6 w-6 sm:h-7 sm:w-7" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-muted-foreground block mb-0.5 sm:mb-1">
                                    {t('dashboard.net_worth') || 'Total Net Worth'}
                                </span>
                                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-foreground whitespace-nowrap overflow-x-auto scrollbar-none">
                                    <CurrencyDisplay value={totalNetWorth} />
                                </h2>
                            </div>
                        </div>

                        {/* Month Flow Pills */}
                        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:flex sm:items-center">
                            {/* Inflow */}
                            <div className="px-3.5 sm:px-5 py-3 sm:py-4 rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset flex items-center gap-2.5 sm:gap-3.5 min-w-0 sm:min-w-[180px]">
                                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-neu-accent-sec/15 text-neu-accent-sec flex items-center justify-center shrink-0">
                                    <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">{t('dashboard.income')}</span>
                                    <span className="text-xs sm:text-base font-extrabold font-mono text-neu-accent-sec block mt-0.5 whitespace-nowrap overflow-x-auto scrollbar-none">
                                        +<CurrencyDisplay value={stats.income} />
                                    </span>
                                </div>
                            </div>

                            {/* Outflow */}
                            <div className="px-3.5 sm:px-5 py-3 sm:py-4 rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset flex items-center gap-2.5 sm:gap-3.5 min-w-0 sm:min-w-[180px]">
                                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                                    <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">{t('dashboard.expense')}</span>
                                    <span className="text-xs sm:text-base font-extrabold font-mono text-rose-500 block mt-0.5 whitespace-nowrap overflow-x-auto scrollbar-none">
                                        -<CurrencyDisplay value={stats.expense} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Quick Action Buttons (Tactile Hub) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <Link
                        to="/transactions/new"
                        className="p-4 rounded-2xl bg-background shadow-neu-extruded-sm dark:shadow-neu-dark-extruded-sm hover:shadow-neu-extruded-hover dark:hover:shadow-neu-dark-extruded-hover active:shadow-neu-inset dark:active:shadow-neu-dark-inset active:translate-y-0.5 transition-all duration-300 flex items-center gap-3 group select-none"
                    >
                        <div className="h-11 w-11 rounded-xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                            <PlusCircle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-foreground block truncate">Catat Transaksi</span>
                            <span className="text-[10px] text-muted-foreground font-medium block truncate">Masuk / Keluar</span>
                        </div>
                    </Link>

                    <Link
                        to="/accounts"
                        className="p-4 rounded-2xl bg-background shadow-neu-extruded-sm dark:shadow-neu-dark-extruded-sm hover:shadow-neu-extruded-hover dark:hover:shadow-neu-dark-extruded-hover active:shadow-neu-inset dark:active:shadow-neu-dark-inset active:translate-y-0.5 transition-all duration-300 flex items-center gap-3 group select-none"
                    >
                        <div className="h-11 w-11 rounded-xl bg-background shadow-neu-inset-deep flex items-center justify-center text-neu-accent-sec group-hover:scale-105 transition-transform shrink-0">
                            <ArrowRightLeft className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-foreground block truncate">Transfer Akun</span>
                            <span className="text-[10px] text-muted-foreground font-medium block truncate">Pindah Saldo</span>
                        </div>
                    </Link>

                    <Link
                        to="/budget"
                        className="p-4 rounded-2xl bg-background shadow-neu-extruded-sm dark:shadow-neu-dark-extruded-sm hover:shadow-neu-extruded-hover dark:hover:shadow-neu-dark-extruded-hover active:shadow-neu-inset dark:active:shadow-neu-dark-inset active:translate-y-0.5 transition-all duration-300 flex items-center gap-3 group select-none"
                    >
                        <div className="h-11 w-11 rounded-xl bg-background shadow-neu-inset-deep flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform shrink-0">
                            <Target className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-foreground block truncate">Atur Anggaran</span>
                            <span className="text-[10px] text-muted-foreground font-medium block truncate">Batas Bulanan</span>
                        </div>
                    </Link>

                    <Link
                        to="/analytics"
                        className="p-4 rounded-2xl bg-background shadow-neu-extruded-sm dark:shadow-neu-dark-extruded-sm hover:shadow-neu-extruded-hover dark:hover:shadow-neu-dark-extruded-hover active:shadow-neu-inset dark:active:shadow-neu-dark-inset active:translate-y-0.5 transition-all duration-300 flex items-center gap-3 group select-none"
                    >
                        <div className="h-11 w-11 rounded-xl bg-background shadow-neu-inset-deep flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform shrink-0">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-foreground block truncate">Analisis Detail</span>
                            <span className="text-[10px] text-muted-foreground font-medium block truncate">Grafik & Tren</span>
                        </div>
                    </Link>
                </div>

                {/* 4. Budget Health Pulse Widget */}
                {budgetPulse.totalBudget > 0 && (
                    <div className="p-6 sm:p-7 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="h-9 w-9 rounded-xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary">
                                    {budgetPulse.percent > 90 ? <AlertCircle className="h-5 w-5 text-rose-500" /> : <ShieldCheck className="h-5 w-5 text-primary" />}
                                </div>
                                <div>
                                    <h3 className="font-bold font-display text-base text-foreground">Status Anggaran Bulan Ini</h3>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        {budgetPulse.remaining >= 0 ? (
                                            <>Sisa aman <span className="font-bold text-foreground"><CurrencyDisplay value={budgetPulse.remaining} /></span> dari total <CurrencyDisplay value={budgetPulse.totalBudget} /></>
                                        ) : (
                                            <span className="text-rose-500 font-bold">Melebihi anggaran sebesar <CurrencyDisplay value={Math.abs(budgetPulse.remaining)} /></span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <span className={cn(
                                "text-xs font-bold px-3 py-1 rounded-full shadow-neu-inset-sm self-start sm:self-auto",
                                budgetPulse.percent > 90 ? "text-rose-500" : "text-primary"
                            )}>
                                {Math.round(budgetPulse.percent)}% Terpakai
                            </span>
                        </div>
                        <div className="h-3.5 w-full bg-background shadow-neu-inset-sm dark:shadow-neu-dark-inset-sm rounded-full overflow-hidden p-0.5">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-1000 ease-out shadow-neu-extruded-sm",
                                    budgetPulse.percent > 90 ? "bg-rose-500" : "bg-primary"
                                )}
                                style={{ width: `${budgetPulse.percent}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* 5. Split Columns: Recent Transactions (Left) & Active Accounts / Savings (Right) */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column: Recent Transactions */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="p-6 sm:p-8 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-background shadow-neu-inset-deep dark:shadow-neu-dark-inset-deep flex items-center justify-center text-primary">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-bold font-display text-foreground">{t('dashboard.recent_transactions')}</h2>
                                        <p className="text-xs text-muted-foreground font-medium">Aktivitas keuangan terbaru</p>
                                    </div>
                                </div>
                                <Button variant="secondary" size="sm" className="hidden sm:flex font-semibold gap-1.5" asChild>
                                    <Link to="/transactions">
                                        {t('dashboard.view_all')} <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {transactions?.slice(0, 6).map((tx) => {
                                    const cat = categoryMap.get(tx.category_id);
                                    return (
                                        <div
                                            key={tx.id}
                                            className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-background shadow-neu-extruded-sm dark:shadow-neu-dark-extruded-sm hover:shadow-neu-extruded-hover dark:hover:shadow-neu-dark-extruded-hover transition-all duration-300 cursor-default"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                <div className={cn(
                                                    "h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center shadow-neu-inset-deep dark:shadow-neu-dark-inset-deep",
                                                    tx.is_transfer
                                                        ? 'text-indigo-500'
                                                        : cat?.type === 'income'
                                                            ? 'text-neu-accent-sec'
                                                            : 'text-rose-500'
                                                )}>
                                                    {tx.is_transfer ? (
                                                        <ArrowRightLeft className="h-5 w-5" />
                                                    ) : cat?.type === 'income' ? (
                                                        <ArrowUpRight className="h-5 w-5" />
                                                    ) : (
                                                        <ArrowDownRight className="h-5 w-5" />
                                                    )}
                                                </div>
                                                <div className="grid min-w-0">
                                                    <p className="font-bold text-sm sm:text-base text-foreground truncate">{tx.name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                        <span className={cn(
                                                            tx.is_transfer ? "text-indigo-500" : cat?.type === 'income' ? "text-neu-accent-sec" : "text-rose-500"
                                                        )}>
                                                            {tx.is_transfer ? 'Transfer' : cat?.name || t('common.uncategorized')}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{new Date(tx.transaction_date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "font-bold font-mono text-sm sm:text-base ml-4 shrink-0",
                                                tx.is_transfer ? 'text-indigo-500' : cat?.type === 'income' ? 'text-neu-accent-sec' : 'text-foreground'
                                            )}>
                                                {tx.is_transfer ? '' : cat?.type === 'income' ? '+' : '-'} <CurrencyDisplay value={Number(tx.amount)} />
                                            </div>
                                        </div>
                                    );
                                })}

                                {(!transactions || transactions.length === 0) && (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                                        <div className="h-16 w-16 rounded-3xl bg-background shadow-neu-inset-deep flex items-center justify-center">
                                            <CreditCard className="h-8 w-8 opacity-40 text-primary" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-foreground">{t('dashboard.no_transactions')}</p>
                                            <p className="text-sm">{t('dashboard.start_tracking')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button variant="secondary" size="sm" className="w-full mt-4 sm:hidden font-semibold gap-1.5" asChild>
                                <Link to="/transactions">
                                    {t('dashboard.view_all')} <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Active Accounts & Savings Overview */}
                    <div className="space-y-6">
                        {/* 1. Accounts Mini List */}
                        <div className="p-6 sm:p-8 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-background shadow-neu-inset-deep dark:shadow-neu-dark-inset-deep flex items-center justify-center text-neu-accent-sec">
                                        <Wallet className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-bold font-display text-lg text-foreground">{t('nav.accounts')}</h3>
                                </div>
                                <Button variant="ghost" size="sm" className="text-primary font-semibold text-xs" asChild>
                                    <Link to="/accounts">Kelola</Link>
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {accounts?.slice(0, 4).map((acc) => (
                                    <div
                                        key={acc.id}
                                        className="p-3.5 rounded-2xl bg-background shadow-neu-extruded-sm dark:shadow-neu-dark-extruded-sm flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 rounded-xl bg-background shadow-neu-inset-sm flex items-center justify-center text-primary font-bold text-xs uppercase">
                                                {acc.name.substring(0, 2)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-foreground truncate">{acc.name}</p>
                                                <p className="text-[11px] text-muted-foreground capitalize font-medium">{acc.type}</p>
                                            </div>
                                        </div>
                                        <span className="font-bold font-mono text-sm text-foreground shrink-0">
                                            <CurrencyDisplay value={Number(acc.balance)} />
                                        </span>
                                    </div>
                                ))}

                                {(!accounts || accounts.length === 0) && (
                                    <p className="text-xs text-muted-foreground text-center py-4">Belum ada akun terdaftar</p>
                                )}
                            </div>
                        </div>

                        {/* 2. Savings Target Preview */}
                        <div className="p-6 sm:p-8 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-background shadow-neu-inset-deep dark:shadow-neu-dark-inset-deep flex items-center justify-center text-primary">
                                        <PiggyBank className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-bold font-display text-lg text-foreground">{t('nav.savings')}</h3>
                                </div>
                                <Button variant="ghost" size="sm" className="text-primary font-semibold text-xs" asChild>
                                    <Link to="/savings">Lihat</Link>
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {savings?.slice(0, 3).map((sav) => (
                                    <div
                                        key={sav.id}
                                        className="p-3.5 rounded-2xl bg-background shadow-neu-extruded-sm dark:shadow-neu-dark-extruded-sm flex items-center justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-foreground truncate">{sav.name}</p>
                                            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3 text-primary" /> Target
                                            </p>
                                        </div>
                                        <span className="font-bold font-mono text-sm text-primary shrink-0">
                                            <CurrencyDisplay value={Number(sav.amount)} />
                                        </span>
                                    </div>
                                ))}

                                {(!savings || savings.length === 0) && (
                                    <p className="text-xs text-muted-foreground text-center py-4">Belum ada target tabungan</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
