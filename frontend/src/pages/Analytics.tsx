import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { financialService } from '@/services/financial';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Activity, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';


export default function AnalyticsPage() {
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

        const prevDate = new Date(selectedYear, selectedMonth - 2, 1); // Month is 1-indexed, so -2 gives prev month index
        const prevMonth = prevDate.getMonth() + 1;
        const prevYear = prevDate.getFullYear();

        let income = 0;
        let expense = 0;
        let saving = 0;

        transactions.forEach(tx => {
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

        // 1. Biggest Expense Category
        if (expenseByCategory.length > 0) {
            const top = expenseByCategory[0];
            list.push({
                icon: TrendingDown,
                color: "text-rose-500",
                bg: "bg-rose-500/10",
                title: "Top Expense",
                desc: `Most spending in ${top.name} (${((top.value / stats.expense) * 100).toFixed(0)}%)`
            });
        }

        // 2. Saving Rate
        if (stats.income > 0) {
            const rate = (stats.saving / stats.income) * 100;
            list.push({
                icon: Activity,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                title: "Saving Rate",
                desc: `You saved ${rate.toFixed(1)}% of income`
            });
        }

        // 3. Cash Flow Health
        const cashFlowColor = stats.income >= stats.expense ? "text-emerald-500" : "text-rose-500";
        const cashFlowBg = stats.income >= stats.expense ? "bg-emerald-500/10" : "bg-rose-500/10";
        list.push({
            icon: stats.income >= stats.expense ? TrendingUp : TrendingDown,
            color: cashFlowColor,
            bg: cashFlowBg,
            title: "Cash Flow",
            desc: stats.income >= stats.expense ? "Positive cash flow this month" : "Expenses exceeded income"
        });

        return list;
    }, [expenseByCategory, stats]);



    // Trend Data (Grouped by Day or Month depending on view)
    const trendData = useMemo(() => {
        if (!filteredTransactions.length) return [];

        const map = new Map<string, { name: string, income: number, expense: number, date: number }>();

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
                name = date.toLocaleString('default', { month: 'short', year: '2-digit' });
                sortDate = date.getTime();
            }

            if (!map.has(key)) {
                map.set(key, { name, income: 0, expense: 0, date: sortDate });
            }

            const entry = map.get(key)!;
            const cat = categoryMap.get(tx.category_id);
            if (cat?.type === 'income') entry.income += Number(tx.amount);
            else if (cat?.type === 'expense') entry.expense += Number(tx.amount);
            // Saving is not plotted in Income/Expense trend lines currently
        });

        return Array.from(map.values()).sort((a, b) => a.date - b.date);
    }, [filteredTransactions, viewMode, categoryMap]);

    const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

    if (loadingTx) {
        return (
            <DashboardLayout>
                <div className="flex h-full items-center justify-center pt-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-8 px-1 sm:px-0">
                {/* Header & Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-display font-bold">Analytics</h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Deep dive into your transaction history</p>
                    </div>
                    <div className="flex bg-secondary/50 p-1 rounded-xl self-start sm:self-auto w-full sm:w-auto overflow-x-auto">
                        <div className="flex w-full sm:w-auto gap-1">
                            {['month', 'year', 'all'].map((mode) => (
                                <Button
                                    key={mode}
                                    variant={viewMode === mode ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode(mode as any)}
                                    className={cn(
                                        "flex-1 sm:flex-none capitalize rounded-lg text-xs sm:text-sm",
                                        viewMode === mode && "bg-white dark:bg-slate-800 shadow-sm"
                                    )}
                                >
                                    {mode === 'all' ? 'All Time' : `${mode}ly`}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                {(viewMode === 'month' || viewMode === 'year') && (
                    <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4 bg-card border border-border rounded-xl">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        {viewMode === 'month' && (
                            <select
                                className="flex-1 sm:flex-none bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                        )}
                        <select
                            className="flex-1 sm:flex-none sm:w-24 bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Smart Insights Section */}
                {viewMode === 'month' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        {insights.map((item, i) => (
                            <div key={i} className="bg-card border border-border/50 p-3 rounded-xl flex items-center gap-3 shadow-sm">
                                <div className={cn("p-2 rounded-lg shrink-0", item.bg, item.color)}>
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.title}</p>
                                    <p className="text-sm font-medium text-foreground">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats Overview */}
                {/* Stats Overview */}
                {/* Stats Overview */}
                <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                    {/* Income Card */}
                    <div className="p-3 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl glass-card hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2 sm:mb-4">
                                <div className="p-1.5 sm:p-2.5 bg-emerald-500/15 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                                    <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-500" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                                    Income
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-2xl lg:text-3xl font-bold font-display text-foreground animate-value truncate">
                                    <CurrencyDisplay value={stats.income} />
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5 sm:mt-1.5">
                                    <p className="text-muted-foreground text-[10px] sm:text-sm">Total Income</p>
                                    {viewMode === 'month' && (
                                        <span className={cn(
                                            "text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
                                            trends.income >= 0 ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" : "text-rose-600 bg-rose-100 dark:bg-rose-900/30"
                                        )}>
                                            {trends.income >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                            {Math.abs(trends.income).toFixed(0)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expense Card */}
                    <div className="p-3 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl glass-card hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-rose-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2 sm:mb-4">
                                <div className="p-1.5 sm:p-2.5 bg-rose-500/15 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                                    <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6 text-rose-500" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full border border-rose-500/20">
                                    Expense
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-2xl lg:text-3xl font-bold font-display text-foreground animate-value truncate">
                                    <CurrencyDisplay value={stats.expense} />
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5 sm:mt-1.5">
                                    <p className="text-muted-foreground text-[10px] sm:text-sm">Total Expense</p>
                                    {viewMode === 'month' && (
                                        <span className={cn(
                                            "text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
                                            trends.expense <= 0 ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" : "text-rose-600 bg-rose-100 dark:bg-rose-900/30"
                                        )}>
                                            {trends.expense > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                            {Math.abs(trends.expense).toFixed(0)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Saving Card */}
                    <div className="p-3 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl glass-card hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2 sm:mb-4">
                                <div className="p-1.5 sm:p-2.5 bg-blue-500/15 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                                    <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full border border-blue-500/20">
                                    Saving
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-2xl lg:text-3xl font-bold font-display text-foreground animate-value truncate">
                                    <CurrencyDisplay value={stats.saving || 0} />
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5 sm:mt-1.5">
                                    <p className="text-muted-foreground text-[10px] sm:text-sm">Total Saved</p>
                                    {viewMode === 'month' && (
                                        <span className={cn(
                                            "text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
                                            trends.saving >= 0 ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" : "text-amber-600 bg-amber-100 dark:bg-amber-900/30"
                                        )}>
                                            {trends.saving >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                            {Math.abs(trends.saving).toFixed(0)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Card */}
                    <div className="p-3 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden hover-lift group">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-3 sm:mb-4">
                                <div className="p-1.5 sm:p-2.5 bg-white/20 rounded-xl backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform">
                                    <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                                    Net
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-2xl lg:text-3xl font-bold font-display tracking-tight drop-shadow-lg animate-value truncate">
                                    <CurrencyDisplay value={stats.net} className="text-white" />
                                </h3>
                                <p className="text-white/80 text-[10px] sm:text-sm mt-1 sm:mt-2">
                                    Net Result
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Trend Chart */}
                <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card shadow-sm">
                    <div className="mb-4 sm:mb-6">
                        <h3 className="font-semibold text-base sm:text-lg">Financial Trend</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{viewMode === 'month' ? 'Daily' : 'Monthly'} breakdown</p>
                    </div>
                    <div className="h-[250px] sm:h-[300px] lg:h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="name"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val: number) => `Rp ${val / 1000}k`}
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
                                    formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Amount']}
                                    labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}
                                    itemStyle={{ color: '#ffffff' }}
                                />
                                <Legend
                                    formatter={(value: any) => <span className="text-sm text-muted-foreground">{value}</span>}
                                />
                                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorInc)" />
                                <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Charts */}
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                    {/* Expense Breakdown */}
                    <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card shadow-sm">
                        <div className="mb-4 sm:mb-6">
                            <h3 className="font-semibold text-base sm:text-lg">Expense Breakdown</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">Where your money goes</p>
                        </div>
                        <div className="h-[240px] sm:h-[280px] lg:h-[300px] w-full">
                            {expenseByCategory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenseByCategory}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={45}
                                            outerRadius={75}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {expenseByCategory.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                                            formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Amount']}
                                            itemStyle={{ color: '#ffffff' }}
                                        />
                                        <Legend
                                            content={({ payload }) => (
                                                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-4 px-2">
                                                    {payload?.map((entry, index) => (
                                                        <div key={`item-${index}`} className="flex items-center gap-2">
                                                            <div
                                                                className="w-2.5 h-2.5 rounded-full"
                                                                style={{ backgroundColor: entry.color }}
                                                            />
                                                            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
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
                                <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
                            )}
                        </div>
                    </div>

                    {/* Income Breakdown */}
                    <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card shadow-sm">
                        <div className="mb-4 sm:mb-6">
                            <h3 className="font-semibold text-base sm:text-lg">Income Sources</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">Where your money comes from</p>
                        </div>
                        <div className="h-[240px] sm:h-[280px] lg:h-[300px] w-full">
                            {incomeByCategory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={incomeByCategory}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={45}
                                            outerRadius={75}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {incomeByCategory.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                                            formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Amount']}
                                            itemStyle={{ color: '#ffffff' }}
                                        />
                                        <Legend
                                            content={({ payload }) => (
                                                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-4 px-2">
                                                    {payload?.map((entry, index) => (
                                                        <div key={`item-${index}`} className="flex items-center gap-2">
                                                            <div
                                                                className="w-2.5 h-2.5 rounded-full"
                                                                style={{ backgroundColor: entry.color }}
                                                            />
                                                            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
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
                                <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Transactions - Mobile Card Layout */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-border">
                        <h3 className="font-semibold text-base sm:text-lg">Top Transactions</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">Highest value transactions</p>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-secondary/50 text-muted-foreground">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left font-medium">Date</th>
                                    <th className="px-4 sm:px-6 py-3 text-left font-medium">Description</th>
                                    <th className="px-4 sm:px-6 py-3 text-left font-medium">Category</th>
                                    <th className="px-4 sm:px-6 py-3 text-right font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredTransactions
                                    .sort((a, b) => Number(b.amount) - Number(a.amount))
                                    .slice(0, 10)
                                    .map(tx => {
                                        const cat = categoryMap.get(tx.category_id);
                                        return (
                                            <tr key={tx.id} className="group hover:bg-surface/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-medium">{tx.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                        cat?.type === 'income' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                                    )}>
                                                        {cat?.name || 'Uncategorized'}
                                                    </span>
                                                </td>
                                                <td className={cn(
                                                    "px-6 py-4 text-right font-mono font-medium",
                                                    cat?.type === 'income' ? "text-green-600 dark:text-green-400" : "text-foreground"
                                                )}>
                                                    {cat?.type === 'income' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                {filteredTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No transactions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card Layout */}
                    <div className="sm:hidden divide-y divide-border">
                        {filteredTransactions
                            .sort((a, b) => Number(b.amount) - Number(a.amount))
                            .slice(0, 5)
                            .map(tx => {
                                const cat = categoryMap.get(tx.category_id);
                                return (
                                    <div key={tx.id} className="p-4 flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{tx.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                                    cat?.type === 'income' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                                )}>
                                                    {cat?.name || 'N/A'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>
                                        <p className={cn(
                                            "font-mono font-semibold text-sm whitespace-nowrap",
                                            cat?.type === 'income' ? "text-green-600 dark:text-green-400" : "text-foreground"
                                        )}>
                                            {cat?.type === 'income' ? '+' : '-'}Rp {Number(tx.amount).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                )
                            })}
                        {filteredTransactions.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground text-sm">No transactions found.</div>
                        )}
                    </div>
                </div>

            </div>
        </DashboardLayout >
    );
}
