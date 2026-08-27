import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { financialService } from '@/services/financial';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Activity, Filter, ArrowUp, ArrowDown, ChevronDown, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { usePreferencesStore } from '@/hooks/usePreferences';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
    const { t } = useTranslation();
    const { language, currency, isAmountHidden } = usePreferencesStore();
    const currentDate = new Date();
    const [viewMode, setViewMode] = useState<'month' | 'year' | 'all'>('month');
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

    const { data: transactions, isLoading: loadingTx } = useQuery({
        queryKey: ['transactions'],
        queryFn: financialService.getTransactions
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: financialService.getCategories
    });

    const categoryMap = useMemo(() => {
        const map = new Map();
        categories?.forEach(c => map.set(c.id, c));
        return map;
    }, [categories]);

    // Filter Data
    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(tx => {
            if (tx.is_transfer) return false;
            const date = new Date(tx.transaction_date);
            if (viewMode === 'all') return true;
            if (viewMode === 'year') return date.getFullYear() === selectedYear;
            return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
        });
    }, [transactions, viewMode, selectedMonth, selectedYear]);

    // Aggregate Stats
    const stats = useMemo(() => {
        let income = 0;
        let expense = 0;
        let saving = 0;

        filteredTransactions.forEach(tx => {
            const cat = categoryMap.get(tx.category_id);
            if (cat?.type === 'income') income += Number(tx.amount);
            else if (cat?.type === 'expense') expense += Number(tx.amount);
            else if (cat?.type === 'saving') saving += Number(tx.amount);
        });

        return { income, expense, saving, net: income - expense - saving };
    }, [filteredTransactions, categoryMap]);

    // Category Breakdown (Expense)
    const expenseByCategory = useMemo(() => {
        const map = new Map<string, number>();
        filteredTransactions.forEach(tx => {
            const cat = categoryMap.get(tx.category_id);
            if (cat?.type === 'expense') {
                map.set(cat.name, (map.get(cat.name) || 0) + Number(tx.amount));
            }
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions, categoryMap]);

    // Category Breakdown (Income)
    const incomeByCategory = useMemo(() => {
        const map = new Map<string, number>();
        filteredTransactions.forEach(tx => {
            const cat = categoryMap.get(tx.category_id);
            if (cat?.type === 'income') {
                map.set(cat.name, (map.get(cat.name) || 0) + Number(tx.amount));
            }
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions, categoryMap]);

    // Comparison Stats (Previous Month)
    const comparisonStats = useMemo(() => {
        if (!transactions) return { income: 0, expense: 0, saving: 0 };

        const prevDate = new Date(selectedYear, selectedMonth - 2, 1);
        const prevMonth = prevDate.getMonth() + 1;
        const prevYear = prevDate.getFullYear();

        let income = 0;
        let expense = 0;
        let saving = 0;

        transactions.forEach(tx => {
            if (tx.is_transfer) return;
            const date = new Date(tx.transaction_date);
            if (date.getMonth() + 1 === prevMonth && date.getFullYear() === prevYear) {
                const cat = categoryMap.get(tx.category_id);
                if (cat?.type === 'income') income += Number(tx.amount);
                else if (cat?.type === 'expense') expense += Number(tx.amount);
                else if (cat?.type === 'saving') saving += Number(tx.amount);
            }
        });

        return { income, expense, saving };
    }, [transactions, selectedMonth, selectedYear, categoryMap]);

    // Calculate Trends
    const trends = useMemo(() => {
        const calcTrend = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        return {
            income: calcTrend(stats.income, comparisonStats.income),
            expense: calcTrend(stats.expense, comparisonStats.expense),
            saving: calcTrend(stats.saving, comparisonStats.saving)
        };
    }, [stats, comparisonStats]);

    // Automated Insights
    const insights = useMemo(() => {
        const list = [];

        if (expenseByCategory.length > 0) {
            const top = expenseByCategory[0];
            list.push({
                icon: TrendingDown,
                color: "text-rose-500",
                title: t('analytics.insights.top_expense'),
                desc: t('analytics.insights.top_expense_desc', { category: top.name, percent: stats.expense > 0 ? ((top.value / stats.expense) * 100).toFixed(0) : '0' })
            });
        }

        if (stats.income > 0) {
            const rate = (stats.saving / stats.income) * 100;
            list.push({
                icon: Activity,
                color: "text-primary",
                title: t('analytics.insights.saving_rate'),
                desc: t('analytics.insights.saving_rate_desc', { percent: rate.toFixed(1) })
            });
        }

        const cashFlowColor = stats.income >= stats.expense ? "text-neu-accent-sec" : "text-rose-500";
        list.push({
            icon: stats.income >= stats.expense ? TrendingUp : TrendingDown,
            color: cashFlowColor,
            title: t('analytics.insights.cash_flow'),
            desc: stats.income >= stats.expense ? t('analytics.insights.positive_flow') : t('analytics.insights.negative_flow')
        });

        return list;
    }, [expenseByCategory, stats, t]);

    // Trend Data
    const trendData = useMemo(() => {
        if (!filteredTransactions.length) return [];

        const map = new Map<string, { name: string; income: number; expense: number; date: number }>();

        filteredTransactions.forEach(tx => {
            const date = new Date(tx.transaction_date);
            let key = '';
            let name = '';
            let sortDate = 0;

            if (viewMode === 'month') {
                key = `${date.getDate()}`;
                name = `${date.getDate()}`;
                sortDate = date.getDate();
            } else {
                key = `${date.getMonth()}-${date.getFullYear()}`;
                name = date.toLocaleString(language || 'en-US', { month: 'short', year: '2-digit' });
                sortDate = date.getTime();
            }

            if (!map.has(key)) {
                map.set(key, { name, income: 0, expense: 0, date: sortDate });
            }

            const entry = map.get(key)!;
            const cat = categoryMap.get(tx.category_id);
            if (cat?.type === 'income') entry.income += Number(tx.amount);
            else if (cat?.type === 'expense') entry.expense += Number(tx.amount);
        });

        return Array.from(map.values()).sort((a, b) => a.date - b.date);
    }, [filteredTransactions, viewMode, categoryMap, language]);

    const COLORS = ['#6C63FF', '#38B2AC', '#8B84FF', '#4FD1C5', '#F6AD55', '#FC8181'];

    if (loadingTx) {
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
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 sm:gap-8 w-full pb-20 md:pb-8 px-1 sm:px-0">
                {/* Controls & Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Filters Row */}
                    {(viewMode === 'month' || viewMode === 'year') ? (
                        <div className="flex items-center gap-3">
                            {viewMode === 'month' && (
                                <div className="relative">
                                    <select
                                        className="appearance-none bg-background shadow-neu-inset dark:shadow-neu-dark-inset rounded-2xl pl-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-semibold"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString(language || 'default', { month: 'long' })}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            )}
                            <div className="relative">
                                <select
                                    className="appearance-none bg-background shadow-neu-inset dark:shadow-neu-dark-inset rounded-2xl pl-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-semibold"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                >
                                    {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    ) : <div />}

                    <div className="flex items-center gap-2 bg-background p-1.5 rounded-2xl shadow-neu-inset dark:shadow-neu-dark-inset self-start sm:self-auto">
                        {(['month', 'year', 'all'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 capitalize",
                                    viewMode === mode
                                        ? "bg-background text-primary shadow-neu-extruded-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {mode === 'all' ? t('analytics.all_time') : mode === 'month' ? t('analytics.monthly') : t('analytics.yearly')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Smart Insights Section */}
                {viewMode === 'month' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {insights.map((item, i) => (
                            <div key={i} className="p-5 rounded-[28px] bg-background shadow-neu-extruded flex items-center gap-3.5">
                                <div className="h-11 w-11 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center shrink-0">
                                    <item.icon className={cn("h-5 w-5", item.color)} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{item.title}</p>
                                    <p className="text-sm font-bold text-foreground truncate mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats Overview */}
                <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                    {/* Income Card */}
                    <div className="p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded min-w-0">
                        <div className="flex justify-between items-center mb-2.5 sm:mb-3">
                            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-neu-accent-sec shrink-0">
                                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-bold text-neu-accent-sec bg-background shadow-neu-inset-sm px-2.5 py-1 rounded-full whitespace-nowrap">
                                {t('analytics.income')}
                            </span>
                        </div>
                        <h3 className="text-base sm:text-2xl font-extrabold font-mono text-foreground block whitespace-nowrap overflow-x-auto scrollbar-none">
                            <CurrencyDisplay value={stats.income} />
                        </h3>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                            <p className="text-muted-foreground text-[10px] sm:text-xs font-semibold truncate">{t('analytics.total_income')}</p>
                            {viewMode === 'month' && (
                                <span className={cn(
                                    "text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-neu-inset-sm flex items-center gap-0.5 shrink-0 whitespace-nowrap",
                                    trends.income >= 0 ? "text-neu-accent-sec" : "text-rose-500"
                                )}>
                                    {trends.income >= 0 ? <ArrowUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ArrowDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                                    {Math.abs(trends.income).toFixed(0)}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Expense Card */}
                    <div className="p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded min-w-0">
                        <div className="flex justify-between items-center mb-2.5 sm:mb-3">
                            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-rose-500 shrink-0">
                                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-bold text-rose-500 bg-background shadow-neu-inset-sm px-2.5 py-1 rounded-full whitespace-nowrap">
                                {t('analytics.expense')}
                            </span>
                        </div>
                        <h3 className="text-base sm:text-2xl font-extrabold font-mono text-rose-500 block whitespace-nowrap overflow-x-auto scrollbar-none">
                            <CurrencyDisplay value={stats.expense} />
                        </h3>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                            <p className="text-muted-foreground text-[10px] sm:text-xs font-semibold truncate">{t('analytics.total_expense')}</p>
                            {viewMode === 'month' && (
                                <span className={cn(
                                    "text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-neu-inset-sm flex items-center gap-0.5 shrink-0 whitespace-nowrap",
                                    trends.expense <= 0 ? "text-neu-accent-sec" : "text-rose-500"
                                )}>
                                    {trends.expense > 0 ? <ArrowUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ArrowDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                                    {Math.abs(trends.expense).toFixed(0)}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Saving Card */}
                    <div className="p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded min-w-0">
                        <div className="flex justify-between items-center mb-2.5 sm:mb-3">
                            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary shrink-0">
                                <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-bold text-primary bg-background shadow-neu-inset-sm px-2.5 py-1 rounded-full whitespace-nowrap">
                                {t('analytics.saving')}
                            </span>
                        </div>
                        <h3 className="text-base sm:text-2xl font-extrabold font-mono text-primary block whitespace-nowrap overflow-x-auto scrollbar-none">
                            <CurrencyDisplay value={stats.saving || 0} />
                        </h3>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                            <p className="text-muted-foreground text-[10px] sm:text-xs font-semibold truncate">{t('analytics.total_saved')}</p>
                        </div>
                    </div>

                    {/* Net Card */}
                    <div className="p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded min-w-0">
                        <div className="flex justify-between items-center mb-2.5 sm:mb-3">
                            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-neu-accent-sec shrink-0">
                                <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-bold text-foreground bg-background shadow-neu-inset-sm px-2.5 py-1 rounded-full whitespace-nowrap">
                                {t('analytics.net')}
                            </span>
                        </div>
                        <h3 className="text-base sm:text-2xl font-extrabold font-mono text-foreground block whitespace-nowrap overflow-x-auto scrollbar-none">
                            <CurrencyDisplay value={stats.net} />
                        </h3>
                        <p className="text-muted-foreground text-[10px] sm:text-xs font-semibold mt-1.5 sm:mt-2 truncate">{t('analytics.net_result')}</p>
                    </div>
                </div>

                {/* Main Trend Chart */}
                <div className="p-6 sm:p-8 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold font-display text-lg text-foreground">{t('analytics.financial_trend')}</h3>
                            <p className="text-xs text-muted-foreground font-medium">{viewMode === 'month' ? t('analytics.daily_breakdown') : t('analytics.monthly_breakdown')}</p>
                        </div>
                    </div>
                    <div className="h-[280px] sm:h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#38B2AC" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#38B2AC" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(163,177,198,0.3)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#6B7280"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#6B7280"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val: number) => `Rp ${val / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#E0E5EC',
                                        borderColor: 'transparent',
                                        borderRadius: '16px',
                                        boxShadow: '9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
                                        color: '#3D4852',
                                        padding: '12px 16px',
                                    }}
                                    formatter={(value: any) => [
                                        isAmountHidden ? '•••••••' : formatCurrency(value || 0, currency, language),
                                        ''
                                    ]}
                                    labelStyle={{ color: '#3D4852', fontWeight: 700, marginBottom: '8px' }}
                                    itemStyle={{ color: '#3D4852', fontWeight: 600 }}
                                />
                                <Legend
                                    formatter={(value: any) => <span className="text-sm font-semibold text-muted-foreground">{value}</span>}
                                />
                                <Area type="monotone" dataKey="income" name="Income" stroke="#38B2AC" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                                <Area type="monotone" dataKey="expense" name="Expense" stroke="#6C63FF" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Charts Grid */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    {/* Expense Breakdown */}
                    <div className="p-6 sm:p-8 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-rose-500">
                                <PieChartIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold font-display text-lg text-foreground">{t('analytics.expense_breakdown')}</h3>
                                <p className="text-xs text-muted-foreground font-medium">{t('analytics.expense_desc')}</p>
                            </div>
                        </div>
                        <div className="h-[280px] sm:h-[320px] w-full">
                            {expenseByCategory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenseByCategory}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {expenseByCategory.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#E0E5EC',
                                                borderColor: 'transparent',
                                                borderRadius: '16px',
                                                boxShadow: '9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
                                                color: '#3D4852',
                                                padding: '12px 16px',
                                            }}
                                            formatter={(value: any) => [
                                                isAmountHidden ? '•••••••' : formatCurrency(value || 0, currency, language),
                                                ''
                                            ]}
                                            itemStyle={{ color: '#3D4852', fontWeight: 600 }}
                                        />
                                        <Legend
                                            content={({ payload }) => (
                                                <div className="flex flex-wrap justify-center gap-3 pt-5">
                                                    {payload?.map((entry, index) => (
                                                        <div key={`item-${index}`} className="flex items-center gap-2">
                                                            <div
                                                                className="w-3 h-3 rounded-full shadow-neu-extruded-sm"
                                                                style={{ backgroundColor: entry.color }}
                                                            />
                                                            <span className="text-xs font-bold text-foreground">
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
                                <div className="h-full flex items-center justify-center text-muted-foreground font-medium">No data available</div>
                            )}
                        </div>
                    </div>

                    {/* Income Breakdown */}
                    <div className="p-6 sm:p-8 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-neu-accent-sec">
                                <PieChartIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold font-display text-lg text-foreground">{t('analytics.income_sources')}</h3>
                                <p className="text-xs text-muted-foreground font-medium">{t('analytics.income_desc')}</p>
                            </div>
                        </div>
                        <div className="h-[280px] sm:h-[320px] w-full">
                            {incomeByCategory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={incomeByCategory}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {incomeByCategory.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#E0E5EC',
                                                borderColor: 'transparent',
                                                borderRadius: '16px',
                                                boxShadow: '9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
                                                color: '#3D4852',
                                                padding: '12px 16px',
                                            }}
                                            formatter={(value: any) => [
                                                isAmountHidden ? '•••••••' : formatCurrency(value || 0, currency, language),
                                                ''
                                            ]}
                                            itemStyle={{ color: '#3D4852', fontWeight: 600 }}
                                        />
                                        <Legend
                                            content={({ payload }) => (
                                                <div className="flex flex-wrap justify-center gap-3 pt-5">
                                                    {payload?.map((entry, index) => (
                                                        <div key={`item-${index}`} className="flex items-center gap-2">
                                                            <div
                                                                className="w-3 h-3 rounded-full shadow-neu-extruded-sm"
                                                                style={{ backgroundColor: entry.color }}
                                                            />
                                                            <span className="text-xs font-bold text-foreground">
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
                                <div className="h-full flex items-center justify-center text-muted-foreground font-medium">No data available</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
