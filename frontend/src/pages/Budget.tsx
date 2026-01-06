import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type Budget, type Saving } from '@/services/financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Pencil, Wallet, Rocket, TrendingUp, ChevronDown, Tag, Calendar, AlignLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';

// Tab Types
type TabType = 'budgets' | 'goals';

export default function BudgetGoalsPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabType>('budgets');

    // Budget State
    const [isBudgetAddOpen, setIsBudgetAddOpen] = useState(false);
    const [isBudgetEditOpen, setIsBudgetEditOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

    // Goals State
    const [isGoalAddOpen, setIsGoalAddOpen] = useState(false);
    const [isGoalEditOpen, setIsGoalEditOpen] = useState(false);
    const [editingSaving, setEditingSaving] = useState<Saving | null>(null);

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

    const [goalFormData, setGoalFormData] = useState<Partial<Saving>>({
        name: '',
        amount: 0,
        saving_date: new Date().toISOString().split('T')[0],
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

    const { data: savings, isLoading: loadingSavings } = useQuery({
        queryKey: ['savings'],
        queryFn: financialService.getSavings
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

    // Computed Data - Goals
    const totalSavings = savings?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;

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

    // Goal Mutations
    const createGoalMutation = useMutation({
        mutationFn: financialService.createSaving,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            setIsGoalAddOpen(false);
            resetGoalForm();
        }
    });

    const updateGoalMutation = useMutation({
        mutationFn: (data: { id: number, saving: Partial<Saving> }) => financialService.updateSaving(data.id, data.saving),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            setIsGoalEditOpen(false);
            setEditingSaving(null);
            resetGoalForm();
        }
    });

    const deleteGoalMutation = useMutation({
        mutationFn: financialService.deleteSaving,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
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

    const resetGoalForm = () => {
        setGoalFormData({
            name: '',
            amount: 0,
            saving_date: new Date().toISOString().split('T')[0],
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
        if (confirm("Are you sure you want to delete this budget?")) {
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

    // Goal Handlers
    const handleGoalEdit = (saving: Saving) => {
        setEditingSaving(saving);
        setGoalFormData({
            name: saving.name,
            amount: saving.amount,
            saving_date: saving.saving_date,
        });
        setIsGoalEditOpen(true);
    };

    const handleGoalDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this goal?")) {
            deleteGoalMutation.mutate(id);
        }
    };

    const handleGoalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSaving) {
            updateGoalMutation.mutate({ id: editingSaving.id, saving: goalFormData });
        } else {
            createGoalMutation.mutate(goalFormData);
        }
    };

    const isLoading = loadingBudgets || loadingTx || loadingSavings;

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-display font-bold">Budget & Goals</h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage spending limits and savings targets</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-secondary/50 p-1 rounded-xl w-full sm:w-auto sm:self-start">
                    <button
                        onClick={() => setActiveTab('budgets')}
                        className={cn(
                            "flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'budgets'
                                ? "bg-white dark:bg-slate-800 shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Wallet className="h-4 w-4 inline-block mr-2" />
                        Budgets
                    </button>
                    <button
                        onClick={() => setActiveTab('goals')}
                        className={cn(
                            "flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'goals'
                                ? "bg-white dark:bg-slate-800 shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Rocket className="h-4 w-4 inline-block mr-2" />
                        Goals
                    </button>
                </div>

                {/* ===================== BUDGETS TAB ===================== */}
                {activeTab === 'budgets' && (
                    <>
                        {/* Budget Controls */}
                        <div className="flex flex-col gap-4">
                            {/* Budget Summary Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/10">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                                        <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                                            <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">Remaining</span>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                                        <CurrencyDisplay value={Math.max(0, budgetStats.reduce((acc, curr) => acc + Number(curr.budget_amount), 0) - budgetStats.reduce((acc, curr) => acc + curr.spent, 0))} />
                                    </p>
                                </div>

                                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/10">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                                        <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
                                            <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Budget</span>
                                    </div>
                                    <p className="text-lg sm:text-2xl font-bold font-mono tracking-tight">
                                        <CurrencyDisplay value={budgetStats.reduce((acc, curr) => acc + Number(curr.budget_amount), 0)} />
                                    </p>
                                </div>

                                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-red-500/5 border border-rose-500/10">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                                        <div className="p-1.5 sm:p-2 bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400">
                                            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Spent</span>
                                    </div>
                                    <p className="text-lg sm:text-2xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400">
                                        <CurrencyDisplay value={budgetStats.reduce((acc, curr) => acc + curr.spent, 0)} />
                                    </p>
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
                                                    {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
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
                                        <Button onClick={resetBudgetForm} className="w-full sm:w-auto shadow-lg shadow-primary/25 hover:shadow-primary/40"><Plus className="mr-2 h-4 w-4" /> Set Budget</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Set Budget</DialogTitle>
                                            <DialogDescription>Create a spending limit for a category.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleBudgetSubmit} className="flex flex-col h-full space-y-6 py-4">
                                            {/* 1. Amount Input - Centerpiece */}
                                            <div className="relative py-4 sm:py-6 bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                                                <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Limit Amount</Label>
                                                <div className="flex items-baseline justify-center relative w-full px-4 sm:px-8">
                                                    <span className="text-xl sm:text-2xl font-bold text-muted-foreground mr-1">Rp</span>
                                                    <Input
                                                        id="amount"
                                                        type="text"
                                                        inputMode="numeric"
                                                        className="text-3xl sm:text-4xl font-bold bg-transparent border-none text-center w-full focus-visible:ring-0 placeholder:text-muted-foreground/20 p-0 shadow-none h-auto"
                                                        placeholder="0"
                                                        value={budgetFormData.budget_amount ? Math.floor(Number(budgetFormData.budget_amount)).toLocaleString('id-ID') : ''}
                                                        onKeyDown={(e) => {
                                                            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        onChange={(e) => {
                                                            const rawValue = e.target.value.replace(/\./g, '');
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
                                                <Label htmlFor="category" className="text-sm font-medium flex items-center gap-2">
                                                    <Tag className="w-4 h-4 text-primary" /> Category
                                                </Label>
                                                <div className="relative">
                                                    <select
                                                        id="category"
                                                        className="appearance-none flex h-14 w-full items-center justify-between rounded-xl border border-input bg-background/50 px-4 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 relative z-10 bg-transparent"
                                                        value={budgetFormData.category_id}
                                                        onChange={(e) => setBudgetFormData({ ...budgetFormData, category_id: Number(e.target.value) })}
                                                        required
                                                    >
                                                        <option value={0} disabled>Select Category</option>
                                                        {categories?.filter(c => c.type === 'expense').map((c) => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-0" />
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Button type="submit" size="lg" className="w-full rounded-xl" disabled={createBudgetMutation.isPending}>
                                                    {createBudgetMutation.isPending ? 'Saving...' : 'Save Budget'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Budget Edit Dialog */}
                        <Dialog open={isBudgetEditOpen} onOpenChange={setIsBudgetEditOpen}>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Edit Budget</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleBudgetSubmit} className="flex flex-col h-full space-y-6 py-4">
                                    {/* 1. Amount Input - Centerpiece */}
                                    <div className="relative py-4 sm:py-6 bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                                        <Label htmlFor="edit-amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Limit Amount</Label>
                                        <div className="flex items-baseline justify-center relative w-full px-4 sm:px-8">
                                            <span className="text-xl sm:text-2xl font-bold text-muted-foreground mr-1">Rp</span>
                                            <Input
                                                id="edit-amount"
                                                type="text"
                                                inputMode="numeric"
                                                className="text-3xl sm:text-4xl font-bold bg-transparent border-none text-center w-full focus-visible:ring-0 placeholder:text-muted-foreground/20 p-0 shadow-none h-auto"
                                                placeholder="0"
                                                value={budgetFormData.budget_amount ? Math.floor(Number(budgetFormData.budget_amount)).toLocaleString('id-ID') : ''}
                                                onKeyDown={(e) => {
                                                    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/\./g, '');
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
                                        <Label htmlFor="edit-category" className="text-sm font-medium flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-primary" /> Category
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
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-0" />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button type="submit" size="lg" className="w-full rounded-xl" disabled={updateBudgetMutation.isPending}>
                                            {updateBudgetMutation.isPending ? 'Updating...' : 'Update Budget'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Budget List */}
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                            {isLoading && <p className="text-muted-foreground">Loading budgets...</p>
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
                                                    <p className="text-xs text-muted-foreground">{new Date(0, item.month - 1).toLocaleString('default', { month: 'short' })} {item.year}</p>
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
                                                <span className="text-muted-foreground font-medium">Spent</span>
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
                                                    {item.percentage}% used
                                                </span>
                                                <span className="text-muted-foreground">
                                                    <CurrencyDisplay value={Math.max(0, item.budget_amount - item.spent)} /> {item.percentage > 100 ? 'over' : 'left'}
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
                                    <h3 className="text-lg font-semibold">No budgets set</h3>
                                    <p className="text-muted-foreground text-sm">Create a budget for this month to track spending.</p>
                                    <Button variant="outline" className="mt-4" onClick={() => setIsBudgetAddOpen(true)}>Create Budget</Button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ===================== GOALS TAB ===================== */}
                {
                    activeTab === 'goals' && (
                        <>
                            {/* Goal Controls */}
                            <div className="flex items-center justify-between gap-4">
                                {/* Summary */}
                                <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/10 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Saved</p>
                                        <p className="text-lg sm:text-xl font-bold font-mono tracking-tight">
                                            <CurrencyDisplay value={totalSavings} />
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Dialog open={isGoalAddOpen} onOpenChange={setIsGoalAddOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={resetGoalForm}><Plus className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Add Goal</span><span className="sm:hidden">Add</span></Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Add Savings Goal</DialogTitle>
                                        <DialogDescription>Set a new financial goal to save towards.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleGoalSubmit} className="flex flex-col h-full space-y-6 py-4">
                                        {/* 1. Amount Input - Centerpiece */}
                                        <div className="relative py-4 sm:py-6 bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                                            <Label htmlFor="goal-amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Target Amount</Label>
                                            <div className="flex items-baseline justify-center relative w-full px-4 sm:px-8">
                                                <span className="text-xl sm:text-2xl font-bold text-muted-foreground mr-1">Rp</span>
                                                <Input
                                                    id="goal-amount"
                                                    type="text"
                                                    inputMode="numeric"
                                                    className="text-3xl sm:text-4xl font-bold bg-transparent border-none text-center w-full focus-visible:ring-0 placeholder:text-muted-foreground/20 p-0 shadow-none h-auto"
                                                    placeholder="0"
                                                    value={goalFormData.amount ? Math.floor(Number(goalFormData.amount)).toLocaleString('id-ID') : ''}
                                                    onKeyDown={(e) => {
                                                        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/\./g, '');
                                                        const numValue = parseInt(rawValue) || 0;
                                                        setGoalFormData({ ...goalFormData, amount: numValue });
                                                    }}
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        {/* 2. Goal Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                                                <AlignLeft className="w-4 h-4 text-primary" /> Goal Name
                                            </Label>
                                            <Input
                                                id="name"
                                                className="h-12 rounded-xl border-input bg-background/50 text-base"
                                                value={goalFormData.name}
                                                onChange={(e) => setGoalFormData({ ...goalFormData, name: e.target.value })}
                                                placeholder="e.g. New Car"
                                                required
                                            />
                                        </div>

                                        {/* 3. Target Date */}
                                        <div className="space-y-2">
                                            <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-primary" /> Target Date
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="date"
                                                    type="date"
                                                    className="h-14 rounded-xl border-input bg-background/50 text-lg font-medium cursor-pointer"
                                                    value={goalFormData.saving_date}
                                                    onClick={(e: any) => {
                                                        if (e.currentTarget.showPicker) {
                                                            e.currentTarget.showPicker();
                                                        }
                                                    }}
                                                    onChange={(e) => setGoalFormData({ ...goalFormData, saving_date: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button type="submit" size="lg" className="w-full rounded-xl" disabled={createGoalMutation.isPending}>
                                                {createGoalMutation.isPending ? 'Saving...' : 'Save Goal'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>


                            {/* Goal Edit Dialog */}
                            <Dialog open={isGoalEditOpen} onOpenChange={setIsGoalEditOpen}>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Edit Goal</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleGoalSubmit} className="flex flex-col h-full space-y-6 py-4">
                                        {/* 1. Amount Input - Centerpiece */}
                                        <div className="relative py-4 sm:py-6 bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                                            <Label htmlFor="edit-goal-amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Target Amount</Label>
                                            <div className="flex items-baseline justify-center relative w-full px-4 sm:px-8">
                                                <span className="text-xl sm:text-2xl font-bold text-muted-foreground mr-1">Rp</span>
                                                <Input
                                                    id="edit-goal-amount"
                                                    type="text"
                                                    inputMode="numeric"
                                                    className="text-3xl sm:text-4xl font-bold bg-transparent border-none text-center w-full focus-visible:ring-0 placeholder:text-muted-foreground/20 p-0 shadow-none h-auto"
                                                    placeholder="0"
                                                    value={goalFormData.amount ? Math.floor(Number(goalFormData.amount)).toLocaleString('id-ID') : ''}
                                                    onKeyDown={(e) => {
                                                        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/\./g, '');
                                                        const numValue = parseInt(rawValue) || 0;
                                                        setGoalFormData({ ...goalFormData, amount: numValue });
                                                    }}
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        {/* 2. Goal Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-name" className="text-sm font-medium flex items-center gap-2">
                                                <AlignLeft className="w-4 h-4 text-primary" /> Goal Name
                                            </Label>
                                            <Input
                                                id="edit-name"
                                                className="h-12 rounded-xl border-input bg-background/50 text-base"
                                                value={goalFormData.name}
                                                onChange={(e) => setGoalFormData({ ...goalFormData, name: e.target.value })}
                                                placeholder="e.g. New Car"
                                                required
                                            />
                                        </div>

                                        {/* 3. Target Date */}
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-date" className="text-sm font-medium flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-primary" /> Target Date
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="edit-date"
                                                    type="date"
                                                    className="h-14 rounded-xl border-input bg-background/50 text-lg font-medium cursor-pointer"
                                                    value={goalFormData.saving_date}
                                                    onClick={(e: any) => {
                                                        if (e.currentTarget.showPicker) {
                                                            e.currentTarget.showPicker();
                                                        }
                                                    }}
                                                    onChange={(e) => setGoalFormData({ ...goalFormData, saving_date: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button type="submit" size="lg" className="w-full rounded-xl" disabled={updateGoalMutation.isPending}>
                                                {updateGoalMutation.isPending ? 'Updating...' : 'Update Goal'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {/* Goals List */}
                            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {isLoading && <p className="text-muted-foreground">Loading goals...</p>
                                }

                                {
                                    !isLoading && savings?.map((goal) => (
                                        <div key={goal.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                                            <div className="p-4 sm:p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="p-2.5 bg-secondary rounded-xl text-primary group-hover:scale-110 transition-transform">
                                                        <Rocket className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleGoalEdit(goal)}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => handleGoalDelete(goal.id)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-lg mb-1 tracking-tight">{goal.name}</h3>
                                                <div className="flex items-baseline gap-2 mb-4">
                                                    <span className="text-2xl font-bold font-mono text-primary tracking-tight">
                                                        <CurrencyDisplay value={Number(goal.amount)} />
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center pt-4 border-t border-border/50 text-xs font-medium text-muted-foreground">
                                                    <span>Target Date</span>
                                                    <span className="bg-secondary px-2 py-1 rounded-md">{new Date(goal.saving_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>

                            {!isLoading && savings?.length === 0 && (
                                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                                    <div className="flex flex-col items-center gap-2">
                                        <Rocket className="h-10 w-10 text-muted-foreground/50" />
                                        <h3 className="text-lg font-semibold">No goals yet</h3>
                                        <p className="text-muted-foreground text-sm">Set a savings goal to start tracking.</p>
                                        <Button variant="outline" className="mt-4" onClick={() => setIsGoalAddOpen(true)}>Add Goal</Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
            </div>
        </DashboardLayout >
    );
}
