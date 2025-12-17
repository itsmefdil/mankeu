import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { financialService } from '@/services/financial';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Activity, Filter } from 'lucide-react';
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

        filteredTransactions.forEach(tx => {
            const cat = categoryMap.get(tx.category_id);
            if (cat?.type === 'income') income += Number(tx.amount);
            else if (cat?.type === 'expense') expense += Number(tx.amount);
        });

        return { income, expense, net: income - expense };
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

                {/* Stats Overview */}
                {/* Stats Overview */}
                <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
                    {/* Income Card */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/10 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Total Income</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate"><CurrencyDisplay value={stats.income} /></h3>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    </div>

                    {/* Expense Card */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-rose-500/10 to-pink-500/5 border border-rose-500/10 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                                    <TrendingDown className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">Total Expense</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate"><CurrencyDisplay value={stats.expense} /></h3>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    </div>

                    {/* Net Card */}
                    <div className={cn(
                        "p-5 sm:p-6 rounded-2xl border relative overflow-hidden group bg-gradient-to-br",
                        stats.net >= 0
                            ? "from-blue-500/10 to-indigo-500/5 border-blue-500/10"
                            : "from-orange-500/10 to-yellow-500/5 border-orange-500/10"
                    )}>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={cn(
                                    "p-2.5 rounded-xl group-hover:scale-110 transition-transform",
                                    stats.net >= 0 ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" : "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                                )}>
                                    <Activity className="h-5 w-5" />
                                </div>
                                <span className={cn(
                                    "text-sm font-semibold",
                                    stats.net >= 0 ? "text-blue-700 dark:text-blue-300" : "text-orange-700 dark:text-orange-300"
                                )}>Net Saved</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate"><CurrencyDisplay value={stats.net} /></h3>
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
