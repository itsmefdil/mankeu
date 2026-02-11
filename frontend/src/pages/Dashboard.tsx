import { useState, useMemo } from 'react';
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
    PieChart as PieChartIcon,
    PiggyBank,
    Landmark
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { usePreferencesStore } from '@/hooks/usePreferences';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { financialService } from '@/services/financial';
import { useAuthStore } from '@/hooks/useAuth';

import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/utils';

export default function Dashboard() {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const { isAmountHidden, currency, language } = usePreferencesStore();
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

    const { data: incomes, isLoading: loadingIncomes } = useQuery({
        queryKey: ['incomes'],
        queryFn: financialService.getIncomes
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: financialService.getCategories
    });

    const { data: accounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: financialService.getAccounts
    });

    // --- Computed Data & Aggregations ---

    const totalNetWorth = useMemo(() => {
        return accounts?.reduce((acc, curr) => acc + Number(curr.balance), 0) || 0;
    }, [accounts]);

    const categoryMap = useMemo(() => {
        const map = new Map();
        categories?.forEach(c => map.set(c.id, c));
        return map;
    }, [categories]);

    // 1. Overview Stats (Filtered by Month/Year)
    const stats = useMemo(() => {
        if (!transactions || !incomes) return { income: 0, expense: 0, saving: 0, balance: 0 };

        let incomeSum = 0;
        let expenseSum = 0;
        let savingSum = 0;

        transactions.forEach(tx => {
            const txDate = new Date(tx.transaction_date);
            if (txDate.getMonth() + 1 !== selectedMonth || txDate.getFullYear() !== selectedYear) return;

            const cat = categoryMap.get(tx.category_id);
            if (cat?.type === 'income') {
                incomeSum += Number(tx.amount);
            } else if (cat?.type === 'expense') {
                expenseSum += Number(tx.amount);
            } else if (cat?.type === 'saving') {
                savingSum += Number(tx.amount);
            }
        });

        // Also add direct incomes from Income table if needed, but keeping existing logic structure
        // If incomes table is used, we should iterate it too:
        // incomes.forEach(inc => ...) 
        // But adhering to current pattern of only using transactions for now to avoid side effects.

        return {
            income: incomeSum,
            expense: expenseSum,
            saving: savingSum,
            balance: incomeSum - expenseSum - savingSum
        };
    }, [transactions, categoryMap, selectedMonth, selectedYear, incomes]);

    // 2. Chart Data: Monthly Trend (Last 6 Months)
    const trendData = useMemo(() => {
        if (!transactions) return [];

        type MonthlyData = {
            name: string;
            month: number;
            year: number;
            income: number;
            expense: number;
        };

        const last6Months: MonthlyData[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(selectedYear, (selectedMonth - 1) - i, 1);
            last6Months.push({
                name: d.toLocaleString('default', { month: 'short' }),
                month: d.getMonth() + 1,
                year: d.getFullYear(),
                income: 0,
                expense: 0
            });
        }

        transactions.forEach(tx => {
            const txDate = new Date(tx.transaction_date);
            const match = last6Months.find(m => m.month === txDate.getMonth() + 1 && m.year === txDate.getFullYear());
            if (match) {
                const cat = categoryMap.get(tx.category_id);
                if (cat?.type === 'income') match.income += Number(tx.amount);
                else if (cat?.type === 'expense') match.expense += Number(tx.amount);
                // Saving is separate
            }
        });

        return last6Months;
    }, [transactions, categoryMap, selectedMonth, selectedYear]);

    // 3. Chart Data: Expense by Category (Current Month)
    const categoryPieData = useMemo(() => {
        if (!transactions) return [];

        const catSums = new Map<string, number>();
        transactions.forEach(tx => {
            const txDate = new Date(tx.transaction_date);
            if (txDate.getMonth() + 1 !== selectedMonth || txDate.getFullYear() !== selectedYear) return;

            const cat = categoryMap.get(tx.category_id);
            if (cat?.type === 'expense') {
                const current = catSums.get(cat.name) || 0;
                catSums.set(cat.name, current + Number(tx.amount));
            }
        });

        const data = Array.from(catSums.entries()).map(([name, value]) => ({ name, value }));
        return data.sort((a, b) => b.value - a.value).slice(0, 6);
    }, [transactions, categoryMap, selectedMonth, selectedYear]);

    // 4. Chart Data: Daily Activity (Current Month)
    const dailyData = useMemo(() => {
        if (!transactions) return [];

        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            income: 0,
            expense: 0
        }));

        transactions.forEach(tx => {
            const txDate = new Date(tx.transaction_date);
            if (txDate.getMonth() + 1 !== selectedMonth || txDate.getFullYear() !== selectedYear) return;

            const dayStats = days[txDate.getDate() - 1];
            if (dayStats) {
                const cat = categoryMap.get(tx.category_id);
                if (cat?.type === 'expense') {
                    dayStats.expense += Number(tx.amount);
                } else if (cat?.type === 'income') {
                    dayStats.income += Number(tx.amount);
                }
            }
        });

        return days;
    }, [transactions, categoryMap, selectedMonth, selectedYear]);

    const COLORS = ['#10b981', '#059669', '#14b8a6', '#0ea5e9', '#f59e0b', '#f43f5e'];

    if (loadingTx || loadingBudgets || loadingIncomes) {
        return (
            <DashboardLayout>
                <div className="flex h-full items-center justify-center pt-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-primary/20" />
                        </div>
                        <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto w-full px-1 sm:px-0 pb-8">
                {/* Header with Filters */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-0.5 sm:space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold">
                                {getGreeting()}, <span className="gradient-text">{user?.name || 'User'}</span>! 👋
                            </h1>
                            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 animate-pulse hidden sm:block" />
                        </div>
                        <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            {t('dashboard.overview_for')} {new Date(0, selectedMonth - 1).toLocaleString(language, { month: 'long' })} {selectedYear}
                        </p>
                    </div>

                    {/* Filter Controls */}
                    <div className="w-full lg:w-auto">
                        <div className="grid grid-cols-2 lg:flex gap-2">
                            <div className="relative">
                                <select
                                    className="w-full lg:w-40 appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2.5 sm:py-2 text-base sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:border-primary/50 cursor-pointer shadow-sm font-medium touch-manipulation"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m} className="bg-white dark:bg-slate-800 text-foreground py-2">
                                            {new Date(0, m - 1).toLocaleString(language, { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </div>

                            <div className="relative">
                                <select
                                    className="w-full lg:w-28 appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2.5 sm:py-2 text-base sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:border-primary/50 cursor-pointer shadow-sm font-medium touch-manipulation"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                >
                                    {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(y => (
                                        <option key={y} value={y} className="bg-white dark:bg-slate-800 text-foreground py-2">{y}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards - Premium Design */}
                <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                    {/* Total Net Worth Card - Featured */}
                    <div className="col-span-2 lg:col-span-2 p-4 sm:p-5 lg:p-6 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-2xl shadow-indigo-500/25 relative overflow-hidden hover-lift group">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-3 sm:mb-4">
                                <div className="p-1.5 sm:p-2.5 bg-white/20 rounded-xl backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform">
                                    <Landmark className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                                    <Target className="h-3 w-3" />
                                    {t('dashboard.net_worth') || 'Net Worth'}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-3xl lg:text-3xl font-bold font-display tracking-tight drop-shadow-lg animate-value truncate">
                                    <CurrencyDisplay value={totalNetWorth} className="text-white" />
                                </h3>
                                <p className="text-white/80 text-[10px] sm:text-sm mt-1 sm:mt-2 flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-400 rounded-full animate-pulse" />
                                    {t('dashboard.all_accounts') || 'All Accounts'}
                                </p>
                            </div>
                        </div>

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                    </div>

                    {/* Balance Card - Monthly Flow */}
                    <div className=" lg:col-span-2 sm:col-span-1 p-3 p-3 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl glass-card hover-lift group relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white shadow-2xl shadow-emerald-500/25 relative overflow-hidden hover-lift group">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-3 sm:mb-4">
                                <div className="p-1.5 sm:p-2.5 bg-white/20 rounded-xl backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform">
                                    <Wallet className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                                    <Target className="h-3 w-3" />
                                    {t('dashboard.net')}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-3xl lg:text-3xl font-bold font-display tracking-tight drop-shadow-lg animate-value truncate">
                                    <CurrencyDisplay value={stats.balance} className="text-white" />
                                </h3>
                                <p className="text-white/80 text-[10px] sm:text-sm mt-1 sm:mt-2 flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse" />
                                    {t('dashboard.current')}
                                </p>
                            </div>
                        </div>

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                    </div>

                    {/* Income Card */}
                    <div className="p-3 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl glass-card hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2 sm:mb-4">
                                <div className="p-1.5 sm:p-2.5 bg-emerald-500/15 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                                    <ArrowUpRight className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-500" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                                    {t('dashboard.income')}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-2xl lg:text-3xl font-bold font-display text-foreground animate-value truncate">
                                    <CurrencyDisplay value={stats.income} />
                                </h3>
                                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1.5">{t('dashboard.total_income')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Expense Card */}
                    <div className="p-3 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl glass-card hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-rose-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2 sm:mb-4">
                                <div className="p-1.5 sm:p-2.5 bg-rose-500/15 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                                    <ArrowDownRight className="h-4 w-4 sm:h-6 sm:w-6 text-rose-500" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full border border-rose-500/20">
                                    {t('dashboard.expense')}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-2xl lg:text-3xl font-bold font-display text-foreground animate-value truncate">
                                    <CurrencyDisplay value={stats.expense} />
                                </h3>
                                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1.5">{t('dashboard.total_expense')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Saving Card */}
                    <div className="p-3 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl glass-card hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2 sm:mb-4">
                                <div className="p-1.5 sm:p-2.5 bg-blue-500/15 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                                    <PiggyBank className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full border border-blue-500/20">
                                    {t('dashboard.saving')}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-2xl lg:text-3xl font-bold font-display text-foreground animate-value truncate">
                                    <CurrencyDisplay value={stats.saving || 0} />
                                </h3>
                                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1.5">{t('dashboard.total_saved')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid - Responsive Layout */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column (Main Stats) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 1. Cash Flow Trend */}
                        <div className="p-4 sm:p-6 glass-card">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl">
                                        <BarChart3 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{t('dashboard.cash_flow_trend')}</h3>
                                        <p className="text-xs text-muted-foreground hidden sm:block">{t('dashboard.income_vs_expense')}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">{t('dashboard.last_6_months')}</span>
                            </div>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-700/50" />
                                        <XAxis
                                            dataKey="name"
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            width={60}
                                            tickFormatter={(value: number) => `${(value / 1000000).toFixed(1)}M`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                borderColor: '#334155',
                                                borderRadius: '12px',
                                                borderWidth: '1px',
                                                color: '#ffffff',
                                                padding: '12px 16px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                                            }}
                                            formatter={(value: any) => [
                                                isAmountHidden ? '•••••••' : formatCurrency(value || 0, currency, language),
                                                ''
                                            ]}
                                            labelStyle={{ color: '#ffffff', marginBottom: '8px', fontWeight: 600 }}
                                            itemStyle={{ color: '#ffffff' }}
                                        />
                                        <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} name={t('dashboard.income')} />
                                        <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} name={t('dashboard.expense')} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Legend */}
                            <div className="flex items-center justify-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-sm text-muted-foreground">{t('dashboard.income')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                                    <span className="text-sm text-muted-foreground">{t('dashboard.expense')}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Daily Activity */}
                        <div className="glass-card p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/10 rounded-xl">
                                        <BarChart3 className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{t('dashboard.daily_activity')}</h3>
                                        <p className="text-xs text-muted-foreground hidden sm:block">{t('dashboard.transaction_frequency')}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">{t('dashboard.this_month')}</span>
                            </div>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-700/50" />
                                        <XAxis
                                            dataKey="day"
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={window.innerWidth < 640 ? 4 : 2}
                                        />
                                        <YAxis
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            width={50}
                                            tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                borderColor: '#334155',
                                                borderRadius: '12px',
                                                borderWidth: '1px',
                                                color: '#ffffff',
                                                padding: '12px 16px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                                            }}
                                            formatter={(value: any) => [
                                                isAmountHidden ? '•••••••' : formatCurrency(value || 0, currency, language),
                                                ''
                                            ]}
                                            labelFormatter={(label) => `${t('dashboard.day')} ${label}`}
                                            labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                                            itemStyle={{ color: '#ffffff' }}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        />
                                        <Bar dataKey="income" name={t('dashboard.income')} fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="expense" name={t('dashboard.expense')} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 3. Recent Transactions */}
                        <div className="glass-card p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl">
                                        <CreditCard className="h-5 w-5 text-primary" />
                                    </div>
                                    <h2 className="text-lg font-bold font-display">{t('dashboard.recent_transactions')}</h2>
                                </div>
                                <Button variant="ghost" className="text-primary hover:text-primary/80 hover:bg-primary/10 gap-1 hidden sm:flex" size="sm">
                                    {t('dashboard.view_all')} <ArrowUpRight className="h-3 w-3" />
                                </Button>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                {transactions?.slice(0, 5).map((tx, index) => {
                                    const cat = categoryMap.get(tx.category_id);
                                    return (
                                        <div
                                            key={tx.id}
                                            className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300 group cursor-default"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                                <div className={cn(
                                                    "h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner border border-white/5 transition-all duration-300 group-hover:scale-110",
                                                    cat?.type === 'income'
                                                        ? 'bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 text-emerald-500'
                                                        : 'bg-gradient-to-br from-rose-400/20 to-rose-600/20 text-rose-500'
                                                )}>
                                                    {cat?.type === 'income' ? <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6" /> : <ArrowDownRight className="h-5 w-5 sm:h-6 sm:w-6" />}
                                                </div>
                                                <div className="grid min-w-0 transition-all duration-300 group-hover:translate-x-1">
                                                    <p className="font-semibold text-sm sm:text-base truncate">{tx.name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span className={cn("font-medium", cat?.type === 'income' ? "text-emerald-500/80" : "text-rose-500/80")}>
                                                            {cat?.name || t('common.uncategorized')}
                                                        </span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="hidden sm:inline">{new Date(tx.transaction_date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "font-bold font-mono text-sm sm:text-base ml-2 sm:ml-4 shrink-0 drop-shadow-sm",
                                                cat?.type === 'income' ? 'text-emerald-500' : 'text-foreground'
                                            )}>
                                                <span className="hidden sm:inline">{cat?.type === 'income' ? '+' : '-'} </span>
                                                <span className="sm:hidden">{cat?.type === 'income' ? '+' : '-'}</span>
                                                <CurrencyDisplay value={Number(tx.amount)} />
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!transactions || transactions.length === 0) && (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                                        <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center">
                                            <CreditCard className="h-8 w-8 opacity-30" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-medium">{t('dashboard.no_transactions')}</p>
                                            <p className="text-sm opacity-70">{t('dashboard.start_tracking')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary/80 hover:bg-primary/10 gap-1 sm:hidden" size="sm">
                                {t('dashboard.view_all')} <ArrowUpRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    {/* Right Column (Sidebar Stats) */}
                    <div className="space-y-6">
                        {/* 1. Expense Breakdown */}
                        <div className="p-4 sm:p-6 glass-card">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-500/10 rounded-xl">
                                        <PieChartIcon className="h-5 w-5 text-rose-500" />
                                    </div>
                                    <h3 className="font-semibold text-lg">{t('dashboard.expense_breakdown')}</h3>
                                </div>
                            </div>
                            <div className="h-[280px] sm:h-[320px] w-full">
                                {categoryPieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryPieData}
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={55}
                                                outerRadius={90}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {categoryPieData.map((_entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                        stroke="transparent"
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1e293b',
                                                    borderColor: '#334155',
                                                    borderRadius: '12px',
                                                    borderWidth: '1px',
                                                    color: '#ffffff',
                                                    padding: '12px 16px',
                                                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                                                }}
                                                labelStyle={{
                                                    color: '#ffffff',
                                                    fontWeight: '600',
                                                    marginBottom: '4px'
                                                }}
                                                itemStyle={{ color: '#ffffff' }}
                                                formatter={(value: any) => [
                                                    isAmountHidden ? '•••••••' : formatCurrency(value || 0, currency, language),
                                                    ''
                                                ]}
                                            />
                                            <Legend
                                                content={({ payload }) => (
                                                    <div className="flex flex-wrap justify-center gap-4 pt-5">
                                                        {payload?.map((entry, index) => (
                                                            <div key={`item-${index}`} className="flex items-center gap-2">
                                                                <div
                                                                    className="w-3 h-3 rounded-full"
                                                                    style={{ backgroundColor: entry.color }}
                                                                />
                                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                    {entry.value}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                                        <div className="p-4 bg-muted/20 rounded-full">
                                            <PieChartIcon className="h-10 w-10 opacity-30" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-medium">{t('dashboard.no_expenses')}</p>
                                            <p className="text-sm opacity-70">{t('dashboard.start_tracking_breakdown')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Budget Status */}
                        <div className="glass-card p-4 sm:p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl">
                                        <Wallet className="h-5 w-5 text-primary" />
                                    </div>
                                    <h2 className="text-lg font-bold font-display">{t('dashboard.budget_status')}</h2>
                                </div>
                            </div>
                            <div className="space-y-5 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[400px]">
                                {budgets?.filter(b => b.month === selectedMonth && b.year === selectedYear).slice(0, 5).map((budget, i) => {
                                    const cat = categoryMap.get(budget.category_id);
                                    const spent = transactions
                                        ?.filter(t => {
                                            const d = new Date(t.transaction_date);
                                            return t.category_id === budget.category_id && d.getMonth() + 1 === budget.month && d.getFullYear() === budget.year;
                                        })
                                        .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

                                    const percent = Math.min((spent / budget.budget_amount) * 100, 100);
                                    const isOver = spent > budget.budget_amount;
                                    const remaining = budget.budget_amount - spent;

                                    return (
                                        <div key={i} className="group">
                                            <div className="flex justify-between text-sm mb-2 items-center">
                                                <div className="flex flex-col max-w-[60%]">
                                                    <span className="font-semibold text-base truncate">{cat?.name || 'Unknown'}</span>
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {isOver ? (
                                                            <span className="text-rose-500 font-medium">{t('dashboard.over')} <CurrencyDisplay value={Math.abs(remaining)} /></span>
                                                        ) : (
                                                            <span><CurrencyDisplay value={remaining} /> {t('dashboard.left')}</span>
                                                        )}
                                                    </span>
                                                </div>
                                                <span className={cn(
                                                    "font-bold text-sm px-3 py-1 rounded-full border transition-all",
                                                    isOver
                                                        ? "text-rose-500 bg-rose-500/10 border-rose-500/20"
                                                        : "text-primary bg-primary/10 border-primary/20"
                                                )}>
                                                    {Math.round(percent)}%
                                                </span>
                                            </div>
                                            <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden",
                                                        isOver
                                                            ? "bg-gradient-to-r from-rose-500 to-red-600"
                                                            : "bg-gradient-to-r from-emerald-500 to-teal-500"
                                                    )}
                                                    style={{ width: `${percent}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5 font-medium">
                                                <span><CurrencyDisplay value={spent} /></span>
                                                <span><CurrencyDisplay value={Number(budget.budget_amount)} /></span>
                                            </div>
                                        </div>
                                    )
                                })}
                                {(!budgets || budgets.filter(b => b.month === selectedMonth && b.year === selectedYear).length === 0) && (
                                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-4">
                                        <div className="h-14 w-14 rounded-full bg-muted/20 flex items-center justify-center">
                                            <Wallet className="h-7 w-7 opacity-30" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-medium">{t('dashboard.no_budgets')}</p>
                                            <Button variant="link" className="px-0 h-auto text-primary mt-2 font-semibold">
                                                <Sparkles className="h-4 w-4 mr-1" />
                                                {t('dashboard.create_budget')}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
