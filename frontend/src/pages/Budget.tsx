import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type Budget } from '@/services/financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Pencil, Wallet, ChevronDown, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { useTranslation } from 'react-i18next';
import { usePreferencesStore } from '@/hooks/usePreferences';

export default function BudgetPage() {
    const { t } = useTranslation();
    const { currency, language } = usePreferencesStore();
    const queryClient = useQueryClient();

    // Budget State
    const [isBudgetAddOpen, setIsBudgetAddOpen] = useState(false);
    const [isBudgetEditOpen, setIsBudgetEditOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

    // Filter State
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

    // Form States
    const [budgetFormData, setBudgetFormData] = useState<Partial<Budget>>({
        category_id: 0,
        budget_amount: 0,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
    });

    // Queries
    const { data: budgets, isLoading: loadingBudgets } = useQuery({
        queryKey: ['budgets'],
        queryFn: financialService.getBudgets
    });

    const { data: transactions, isLoading: loadingTx } = useQuery({
        queryKey: ['transactions'],
        queryFn: financialService.getTransactions
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: financialService.getCategories
    });

    // Computed Data - Budgets
    const filteredBudgets = useMemo(() => {
        if (!budgets) return [];
        return budgets.filter(b => b.month === selectedMonth && b.year === selectedYear);
    }, [budgets, selectedMonth, selectedYear]);

    const budgetStats = useMemo(() => {
        if (!filteredBudgets || !transactions) return [];

        return filteredBudgets.map(budget => {
            const spent = transactions
                .filter(tx => {
                    const txDate = new Date(tx.transaction_date);
                    return tx.category_id === budget.category_id &&
                        txDate.getMonth() + 1 === budget.month &&
                        txDate.getFullYear() === budget.year;
                })
                .reduce((sum, tx) => sum + Number(tx.amount), 0);

            const category = categories?.find(c => c.id === budget.category_id);
            const percentage = Math.min(100, Math.round((spent / budget.budget_amount) * 100));

            return {
                ...budget,
                spent,
                percentage,
                categoryName: category?.name || 'Unknown'
            };
        });
    }, [filteredBudgets, transactions, categories]);

    // Computed Data - Incomes
    const totalIncome = useMemo(() => {
        if (!transactions || !categories) return 0;

        return transactions
            .filter(tx => {
                const txDate = new Date(tx.transaction_date);
                return txDate.getMonth() + 1 === selectedMonth && txDate.getFullYear() === selectedYear;
            })
            .reduce((sum, tx) => {
                const category = categories.find(c => c.id === tx.category_id);
                if (category?.type === 'income') {
                    return sum + Number(tx.amount);
                }
                return sum;
            }, 0);
    }, [transactions, categories, selectedMonth, selectedYear]);

    // Budget Mutations
    const createBudgetMutation = useMutation({
        mutationFn: financialService.createBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
            setIsBudgetAddOpen(false);
            resetBudgetForm();
        }
    });

    const updateBudgetMutation = useMutation({
        mutationFn: (data: { id: number, budget: Partial<Budget> }) => financialService.updateBudget(data.id, data.budget),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
            setIsBudgetEditOpen(false);
            setEditingBudget(null);
            resetBudgetForm();
        }
    });

    const deleteBudgetMutation = useMutation({
        mutationFn: financialService.deleteBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        }
    });

    // Reset Functions
    const resetBudgetForm = () => {
        setBudgetFormData({
            category_id: 0,
            budget_amount: 0,
            month: selectedMonth,
            year: selectedYear,
        });
    };

    // Budget Handlers
    const handleBudgetEdit = (budget: Budget) => {
        setEditingBudget(budget);
        setBudgetFormData({
            category_id: budget.category_id,
            budget_amount: budget.budget_amount,
            month: budget.month,
            year: budget.year,
        });
        setIsBudgetEditOpen(true);
    };

    const handleBudgetDelete = (id: number) => {
        if (confirm(t('budget.delete_budget_confirm'))) {
            deleteBudgetMutation.mutate(id);
        }
    };

    const handleBudgetSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBudget) {
            updateBudgetMutation.mutate({ id: editingBudget.id, budget: budgetFormData });
        } else {
            createBudgetMutation.mutate(budgetFormData);
        }
    };

    const isLoading = loadingBudgets || loadingTx;

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-display font-bold">{t('budget.title')}</h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t('budget.description')}</p>
                    </div>
                </div>

                {/* Budget Controls */}
                <div className="flex flex-col gap-4">
                    {/* Budget Summary Compact Card - Vertical */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t('budget.remaining')}</p>
                                <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                    <CurrencyDisplay value={Math.max(0, totalIncome - budgetStats.reduce((acc, curr) => acc + Number(curr.budget_amount), 0))} />
                                </p>
                            </div>
                            <div className="h-px bg-slate-100 dark:bg-slate-700" />
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t('budget.total_budget')}</p>
                                <p className="text-sm font-bold font-mono">
                                    <CurrencyDisplay value={budgetStats.reduce((acc, curr) => acc + Number(curr.budget_amount), 0)} />
                                </p>
                            </div>
                            <div className="h-px bg-slate-100 dark:bg-slate-700" />
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t('budget.total_spent')}</p>
                                <p className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
                                    <CurrencyDisplay value={budgetStats.reduce((acc, curr) => acc + curr.spent, 0)} />
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex sm:items-center justify-between gap-4 flex-col sm:flex-row">
                        <div className="grid grid-cols-2 lg:flex gap-2 w-full lg:w-auto">
                            <div className="relative">
                                <select
                                    className="w-full lg:w-40 appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2.5 sm:py-2 text-base sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:border-primary/50 cursor-pointer shadow-sm font-medium touch-manipulation"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m} className="bg-white dark:bg-slate-800 text-foreground py-2">
                                            {new Date(0, m - 1).toLocaleString(language || 'en-US', { month: 'long' })}
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

                        <Dialog open={isBudgetAddOpen} onOpenChange={setIsBudgetAddOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={resetBudgetForm} className="w-full sm:w-auto shadow-lg shadow-primary/25 hover:shadow-primary/40 rounded-xl"><Plus className="mr-2 h-4 w-4" /> {t('budget.set_budget')}</Button>
                            </DialogTrigger>
                            <DialogContent className={cn(
                                "flex flex-col gap-0 p-0 overflow-hidden",
                                "w-full sm:w-auto h-full sm:h-auto",
                                "sm:max-w-[425px] sm:rounded-2xl",
                                "border-0 sm:border"
                            )}>
                                <DialogHeader className="px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-border/50 shrink-0">
                                    <DialogTitle>{t('budget.set_budget_title')}</DialogTitle>
                                    <DialogDescription>{t('budget.set_budget_desc')}</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleBudgetSubmit} className="flex flex-col h-full bg-background">
                                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                                        {/* 1. Amount Input - Centerpiece */}
                                        <div className="relative py-4 sm:py-6 bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                                            <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t('budget.limit_amount')}</Label>
                                            <div className="flex items-baseline justify-center relative w-full px-4 sm:px-8">
                                                <span className="text-xl sm:text-2xl font-bold text-muted-foreground mr-1">{currency === 'USD' ? '$' : 'Rp'}</span>
                                                <Input
                                                    id="amount"
                                                    type="text"
                                                    inputMode="numeric"
                                                    className="text-3xl sm:text-4xl font-bold bg-transparent border-none text-center w-full focus-visible:ring-0 placeholder:text-muted-foreground/20 p-0 shadow-none h-auto hover:bg-transparent"
                                                    placeholder="0"
                                                    value={budgetFormData.budget_amount ? Math.floor(Number(budgetFormData.budget_amount)).toLocaleString(language) : ''}
                                                    onKeyDown={(e) => {
                                                        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                                        const numValue = parseInt(rawValue) || 0;
                                                        setBudgetFormData({ ...budgetFormData, budget_amount: numValue });
                                                    }}
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        {/* 2. Category Select */}
                                        <div className="space-y-2">
                                            <Label htmlFor="category" className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                                <Tag className="w-4 h-4 text-primary" /> {t('budget.category_label')}
                                            </Label>
                                            <div className="relative">
                                                <select
                                                    id="category"
                                                    className="appearance-none flex h-14 w-full items-center justify-between rounded-xl border border-input bg-background/50 px-4 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 relative z-10 bg-transparent"
                                                    value={budgetFormData.category_id}
                                                    onChange={(e) => setBudgetFormData({ ...budgetFormData, category_id: Number(e.target.value) })}
                                                    required
                                                >
                                                    <option value={0} disabled>{t('budget.select_category')}</option>
                                                    {categories?.filter(c => c.type === 'expense').map((c) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-0 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 p-6 bg-background border-t border-border/50">
                                        <Button type="submit" size="lg" className="w-full rounded-xl shadow-lg" disabled={createBudgetMutation.isPending}>
                                            {createBudgetMutation.isPending ? t('budget.saving') : t('budget.save_budget_btn')}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Budget Edit Dialog */}
                <Dialog open={isBudgetEditOpen} onOpenChange={setIsBudgetEditOpen}>
                    <DialogContent className={cn(
                        "flex flex-col gap-0 p-0 overflow-hidden",
                        "w-full sm:w-auto h-full sm:h-auto",
                        "sm:max-w-[425px] sm:rounded-2xl",
                        "border-0 sm:border"
                    )}>
                        <DialogHeader className="px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-border/50 shrink-0">
                            <DialogTitle>{t('budget.edit_budget_title')}</DialogTitle>
                            <DialogDescription>{t('budget.edit_budget_desc')}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleBudgetSubmit} className="flex flex-col h-full bg-background">
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                                {/* 1. Amount Input - Centerpiece */}
                                <div className="relative py-4 sm:py-6 bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                                    <Label htmlFor="edit-amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t('budget.limit_amount')}</Label>
                                    <div className="flex items-baseline justify-center relative w-full px-4 sm:px-8">
                                        <span className="text-xl sm:text-2xl font-bold text-muted-foreground mr-1">{currency === 'USD' ? '$' : 'Rp'}</span>
                                        <Input
                                            id="edit-amount"
                                            type="text"
                                            inputMode="numeric"
                                            className="text-3xl sm:text-4xl font-bold bg-transparent border-none text-center w-full focus-visible:ring-0 placeholder:text-muted-foreground/20 p-0 shadow-none h-auto hover:bg-transparent"
                                            placeholder="0"
                                            value={budgetFormData.budget_amount ? Math.floor(Number(budgetFormData.budget_amount)).toLocaleString(language) : ''}
                                            onKeyDown={(e) => {
                                                if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onChange={(e) => {
                                                const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                                const numValue = parseInt(rawValue) || 0;
                                                setBudgetFormData({ ...budgetFormData, budget_amount: numValue });
                                            }}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* 2. Category Select */}
                                <div className="space-y-2">
                                    <Label htmlFor="edit-category" className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                        <Tag className="w-4 h-4 text-primary" /> {t('budget.category_label')}
                                    </Label>
                                    <div className="relative">
                                        <select
                                            id="edit-category"
                                            className="appearance-none flex h-14 w-full items-center justify-between rounded-xl border border-input bg-background/50 px-4 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 relative z-10 bg-transparent"
                                            value={budgetFormData.category_id}
                                            onChange={(e) => setBudgetFormData({ ...budgetFormData, category_id: Number(e.target.value) })}
                                            required
                                        >
                                            {categories?.filter(c => c.type === 'expense').map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-0 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 p-6 bg-background border-t border-border/50">
                                <Button type="submit" size="lg" className="w-full rounded-xl shadow-lg" disabled={updateBudgetMutation.isPending}>
                                    {updateBudgetMutation.isPending ? t('budget.updating') : t('budget.update_budget_btn')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Budget List */}
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                    {isLoading && <p className="text-muted-foreground">{t('budget.loading_budgets')}</p>
                    }

                    {
                        !isLoading && budgetStats.map((item) => (
                            <div key={item.id} className="p-4 sm:p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                                            <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base sm:text-lg tracking-tight">{item.categoryName}</h3>
                                            <p className="text-xs text-muted-foreground">{new Date(0, item.month - 1).toLocaleString(language || 'en-US', { month: 'short' })} {item.year}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleBudgetEdit(item)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => handleBudgetDelete(item.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-baseline text-sm">
                                        <span className="text-muted-foreground font-medium">{t('budget.spent')}</span>
                                        <div className="text-right">
                                            <span className="font-bold text-base"><CurrencyDisplay value={item.spent} /></span>
                                            <span className="text-muted-foreground ml-1">/ <CurrencyDisplay value={item.budget_amount} /></span>
                                        </div>
                                    </div>
                                    <Progress
                                        value={item.percentage}
                                        className={cn("h-2.5 rounded-full bg-slate-100 dark:bg-slate-800", item.percentage > 100 ? "[&>div]:bg-rose-500" : "[&>div]:bg-primary")}
                                    />
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className={item.percentage > 100 ? "text-rose-500" : "text-primary"}>
                                            {item.percentage}% {t('budget.used')}
                                        </span>
                                        <span className="text-muted-foreground">
                                            <CurrencyDisplay value={Math.max(0, item.budget_amount - item.spent)} /> {item.percentage > 100 ? t('budget.over') : t('budget.left')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>

                {!isLoading && budgetStats.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-border rounded-xl">
                        <div className="flex flex-col items-center gap-2">
                            <Wallet className="h-10 w-10 text-muted-foreground/50" />
                            <h3 className="text-lg font-semibold">{t('budget.no_budgets')}</h3>
                            <p className="text-muted-foreground text-sm">{t('budget.no_budgets_desc')}</p>
                            <Button variant="outline" className="mt-4" onClick={() => setIsBudgetAddOpen(true)}>{t('budget.create_budget')}</Button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
