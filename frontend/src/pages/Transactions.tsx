import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type Transaction, type Category, type Account } from '@/services/financial';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Plus, Trash2, Pencil, Filter, Calendar as CalendarIcon, ChevronDown, Tag, AlignLeft, Search, Tags, Wallet, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SwipeableItem } from '@/components/SwipeableItem';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useTranslation } from 'react-i18next';
import { usePreferencesStore } from '@/hooks/usePreferences';

const vibrate = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

export default function TransactionsPage() {
    const { t } = useTranslation();
    const { language } = usePreferencesStore();
    const queryClient = useQueryClient();
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: number } | null>(null);

    // Form State
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
    const [showFilters, setShowFilters] = useState(false);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Queries
    const { data: transactions, isLoading } = useQuery({
        queryKey: ['transactions'],
        queryFn: financialService.getTransactions
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: financialService.getCategories
    });

    const { data: savings } = useQuery({
        queryKey: ['savings'],
        queryFn: financialService.getSavings
    });

    const { data: accounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: financialService.getAccounts
    });

    // Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return transactions?.filter(tx => {
            const category = categories?.find(c => c.id === tx.category_id);
            if (category?.type === 'saving') return false;

            const matchesSearch = tx.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'all' || tx.category_id === Number(filterCategory);

            const txDate = new Date(tx.transaction_date);
            const matchesDate = txDate.getMonth() + 1 === filterMonth && txDate.getFullYear() === filterYear;

            return matchesSearch && matchesCategory && matchesDate;
        }).sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    }, [transactions, categories, searchQuery, filterCategory, filterMonth, filterYear]);

    // Grouping
    const groupedTransactions = useMemo(() => {
        if (!filteredTransactions) return {};
        return filteredTransactions.reduce((acc, tx) => {
            const dateStr = new Date(tx.transaction_date).toISOString().split('T')[0];
            if (!acc[dateStr]) acc[dateStr] = [];
            acc[dateStr].push(tx);
            return acc;
        }, {} as Record<string, Transaction[]>);
    }, [filteredTransactions]);

    // Daily Expense Calculations
    const todayStr = new Date().toISOString().split('T')[0];
    const todayExpense = useMemo(() => {
        if (!transactions || !categories) return 0;
        return transactions
            .filter(tx => {
                const txDateStr = new Date(tx.transaction_date).toISOString().split('T')[0];
                const cat = categories.find(c => c.id === tx.category_id);
                return txDateStr === todayStr && cat?.type === 'expense' && !tx.is_transfer;
            })
            .reduce((sum, tx) => sum + Number(tx.amount), 0);
    }, [transactions, categories, todayStr]);

    const avgDailyExpense = useMemo(() => {
        if (!transactions || !categories) return 0;
        const now = new Date();
        const daysInCurrentMonth = now.getDate();
        const totalMonthExpense = transactions
            .filter(tx => {
                const txDate = new Date(tx.transaction_date);
                const cat = categories.find(c => c.id === tx.category_id);
                return txDate.getMonth() === now.getMonth() &&
                    txDate.getFullYear() === now.getFullYear() &&
                    cat?.type === 'expense' &&
                    !tx.is_transfer;
            })
            .reduce((sum, tx) => sum + Number(tx.amount), 0);

        return daysInCurrentMonth > 0 ? totalMonthExpense / daysInCurrentMonth : 0;
    }, [transactions, categories]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: financialService.createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            setIsAddOpen(false);
            vibrate([50, 30, 50]);
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number; tx: Partial<Transaction> }) =>
            financialService.updateTransaction(data.id, data.tx),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            setIsEditOpen(false);
            setEditingTx(null);
            vibrate(10);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: financialService.deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: financialService.bulkDeleteTransactions,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            setSelectedIds([]);
        }
    });

    // Category Management State
    const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
    const [isCategoryAddOpen, setIsCategoryAddOpen] = useState(false);
    const [isCategoryEditOpen, setIsCategoryEditOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryFormData, setCategoryFormData] = useState<Partial<Category>>({
        name: '',
        type: 'expense'
    });
    const [categoryDeleteConfirmOpen, setCategoryDeleteConfirmOpen] = useState(false);

    const createCategoryMutation = useMutation({
        mutationFn: financialService.createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsCategoryAddOpen(false);
            setCategoryFormData({ name: '', type: 'expense' });
            vibrate([50, 30, 50]);
        }
    });

    const updateCategoryMutation = useMutation({
        mutationFn: (data: { id: number; cat: Partial<Category> }) => financialService.updateCategory(data.id, data.cat),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsCategoryEditOpen(false);
            setEditingCategory(null);
            setCategoryFormData({ name: '', type: 'expense' });
        }
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: financialService.deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsCategoryEditOpen(false);
            setEditingCategory(null);
            setCategoryFormData({ name: '', type: 'expense' });
        }
    });

    const handleCategoryCardClick = (cat: Category) => {
        setEditingCategory(cat);
        setCategoryFormData({ name: cat.name, type: cat.type });
        setIsCategoryEditOpen(true);
    };

    const handleCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            updateCategoryMutation.mutate({ id: editingCategory.id, cat: categoryFormData });
        } else {
            createCategoryMutation.mutate(categoryFormData);
        }
    };

    const confirmCategoryDelete = () => {
        if (editingCategory) {
            deleteCategoryMutation.mutate(editingCategory.id);
        }
        setCategoryDeleteConfirmOpen(false);
    };

    const handleEdit = (tx: Transaction) => {
        setEditingTx(tx);
        setIsEditOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteTarget({ type: 'single', id });
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (deleteTarget?.type === 'single' && deleteTarget.id) {
            deleteMutation.mutate(deleteTarget.id);
        } else if (deleteTarget?.type === 'bulk') {
            bulkDeleteMutation.mutate(selectedIds);
        }
        setDeleteConfirmOpen(false);
        setDeleteTarget(null);
    };

    const handleSubmit = (e: React.FormEvent, data: Partial<Transaction>) => {
        e.preventDefault();
        const submissionData = { ...data };
        if (submissionData.goal_id === 0) submissionData.goal_id = undefined;

        if (editingTx) {
            updateMutation.mutate({ id: editingTx.id, tx: submissionData });
        } else {
            createMutation.mutate(submissionData);
        }
    };

    const toggleSelectAll = () => {
        if (filteredTransactions && selectedIds.length === filteredTransactions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredTransactions ? filteredTransactions.map(t => t.id) : []);
        }
    };

    const toggleSelectOne = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkDelete = () => {
        setDeleteTarget({ type: 'bulk' });
        setDeleteConfirmOpen(true);
    };

    const formatDateHeader = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return t('transactions.today');
        if (date.toDateString() === yesterday.toDateString()) return t('transactions.yesterday');

        return date.toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' });
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 sm:gap-8 w-full pb-20 md:pb-8 px-1 sm:px-0">
                {/* Mobile FAB */}
                {!isDesktop && (
                    <button
                        className="fixed bottom-24 right-6 h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-neu-extruded z-40 flex items-center justify-center active:translate-y-0.5 active:shadow-neu-inset-sm transition-all"
                        onClick={() => {
                            vibrate(10);
                            setIsAddOpen(true);
                        }}
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    {selectedIds.length > 0 && (
                        <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending} className="font-semibold gap-2">
                            <Trash2 className="h-4 w-4" /> <span>{t('transactions.delete')}</span> ({selectedIds.length})
                        </Button>
                    )}

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="font-semibold gap-2 hidden sm:flex">
                                <Plus className="h-4 w-4" /> {t('transactions.new_transaction')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[560px]">
                            <DialogHeader>
                                <DialogTitle>{t('transactions.add_transaction')}</DialogTitle>
                                <DialogDescription>{t('transactions.add_description')}</DialogDescription>
                            </DialogHeader>
                            <TransactionForm
                                categories={categories}
                                accounts={accounts}
                                savings={savings}
                                onSubmit={handleSubmit}
                                isSubmitting={createMutation.isPending}
                                initialData={null}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Daily Summary 2-Column Grid (Pilihan A) */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                    {/* Today Expense */}
                    <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-[28px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                        <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-rose-500 shrink-0">
                            <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block truncate">
                                {t('transactions.today_expense')}
                            </span>
                            <h3 className="text-xs sm:text-lg lg:text-xl font-extrabold font-mono text-rose-500 block mt-0.5 whitespace-nowrap overflow-x-auto scrollbar-none">
                                <CurrencyDisplay value={todayExpense} />
                            </h3>
                        </div>
                    </div>

                    {/* Avg Daily Expense */}
                    <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-[28px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                        <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary shrink-0">
                            <AlignLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block truncate">
                                {t('transactions.avg_daily')}
                            </span>
                            <h3 className="text-xs sm:text-lg lg:text-xl font-extrabold font-mono text-foreground block mt-0.5 whitespace-nowrap overflow-x-auto scrollbar-none">
                                <CurrencyDisplay value={avgDailyExpense} />
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Filters & Search Bar */}
                <div className="space-y-3.5">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                deep
                                className="pl-11 h-12 text-sm font-medium"
                                placeholder={t('transactions.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Button
                            variant="secondary"
                            className="font-semibold gap-2 h-12 px-4"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4 text-primary" />
                            <span className="hidden sm:inline">Filter</span>
                        </Button>
                    </div>

                    {/* Horizontal Category Filter Pills (Scrollable Carousel) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 px-1 custom-scrollbar no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setFilterCategory('all')}
                            className={cn(
                                "px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 select-none",
                                filterCategory === 'all'
                                    ? "bg-background text-primary shadow-neu-inset font-black"
                                    : "bg-background text-muted-foreground shadow-neu-extruded-sm hover:text-foreground active:shadow-neu-inset-sm"
                            )}
                        >
                            ✨ Semua Kategori
                        </button>

                        {categories?.filter(c => c.type !== 'saving').map((cat) => {
                            const isSelected = filterCategory === String(cat.id);
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFilterCategory(isSelected ? 'all' : String(cat.id))}
                                    className={cn(
                                        "px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 select-none flex items-center gap-1.5",
                                        isSelected
                                            ? "bg-background text-primary shadow-neu-inset font-black"
                                            : "bg-background text-muted-foreground shadow-neu-extruded-sm hover:text-foreground active:shadow-neu-inset-sm"
                                    )}
                                >
                                    <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        cat.type === 'income' ? "bg-neu-accent-sec" : "bg-rose-500"
                                    )} />
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-2 sm:flex gap-3 pt-1">
                            <div className="relative">
                                <select
                                    className="appearance-none h-11 w-full sm:w-36 rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset pl-4 pr-10 text-sm text-foreground font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary"
                                    value={filterMonth}
                                    onChange={(e) => setFilterMonth(Number(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>{new Date(0, m - 1).toLocaleString(language, { month: 'short' })}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>

                            <div className="relative">
                                <select
                                    className="appearance-none h-11 w-full sm:w-28 rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset pl-4 pr-10 text-sm text-foreground font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary"
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(Number(e.target.value))}
                                >
                                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between px-2 pt-2">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="selectAll"
                                className="h-4 w-4 rounded border-none bg-background shadow-neu-inset cursor-pointer accent-primary"
                                checked={filteredTransactions && filteredTransactions.length > 0 && selectedIds.length === filteredTransactions.length}
                                onChange={toggleSelectAll}
                            />
                            <label htmlFor="selectAll" className="text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer select-none">
                                {t('transactions.select_all')}
                            </label>
                        </div>
                        <span className="text-xs font-bold text-primary bg-background shadow-neu-inset-sm px-3 py-1 rounded-full">
                            {filteredTransactions?.length || 0} {t('transactions.count_suffix')}
                        </span>
                    </div>
                </div>

                {/* Transactions Grouped List */}
                <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries({ queryKey: ['transactions'] }); }}>
                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="text-center py-16 text-muted-foreground font-medium animate-pulse">{t('transactions.loading')}</div>
                        ) : Object.keys(groupedTransactions).length === 0 ? (
                            <div className="p-12 rounded-[32px] bg-background shadow-neu-extruded flex flex-col items-center justify-center gap-3 text-center">
                                <div className="h-16 w-16 rounded-3xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary">
                                    <CalendarIcon className="w-8 h-8 opacity-50" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">{t('transactions.no_transactions')}</h3>
                                <p className="text-sm text-muted-foreground">{t('transactions.no_transactions_desc')}</p>
                            </div>
                        ) : (
                            Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map((date) => (
                                <div key={date} className="space-y-3">
                                    <div className="flex items-center justify-between px-2 py-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-extrabold font-display text-base text-foreground">
                                                {formatDateHeader(date)}
                                            </h3>
                                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-background shadow-neu-inset-sm text-muted-foreground">
                                                {groupedTransactions[date].length}
                                            </span>
                                        </div>

                                        {/* Daily Net */}
                                        <div className="text-sm font-bold font-mono">
                                            {(() => {
                                                const dailyTotal = groupedTransactions[date].reduce((acc, tx) => {
                                                    const cat = categories?.find(c => c.id === tx.category_id);
                                                    const amount = Number(tx.amount);
                                                    return cat?.type === 'income' ? acc + amount : acc - amount;
                                                }, 0);

                                                return (
                                                    <span className={cn(
                                                        dailyTotal >= 0 ? "text-neu-accent-sec" : "text-rose-500"
                                                    )}>
                                                        {dailyTotal > 0 ? '+' : ''}<CurrencyDisplay value={dailyTotal} />
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        {groupedTransactions[date].map((tx) => {
                                            const cat = categories?.find(c => c.id === tx.category_id);
                                            const isIncome = cat?.type === 'income';

                                            return (
                                                <SwipeableItem
                                                    key={tx.id}
                                                    onSwipeLeft={() => handleDelete(tx.id)}
                                                    onSwipeRight={() => handleEdit(tx)}
                                                    vibrate={() => vibrate(10)}
                                                    leftContent={<Trash2 className="w-5 h-5 text-white" />}
                                                    rightContent={<Pencil className="w-5 h-5 text-white" />}
                                                    className={cn(
                                                        "p-4 rounded-[28px] bg-background shadow-neu-extruded-sm hover:shadow-neu-extruded-hover transition-all duration-300 cursor-pointer select-none",
                                                        selectedIds.includes(tx.id) && "shadow-neu-inset"
                                                    )}
                                                >
                                                    <div
                                                        className="flex items-center justify-between gap-4"
                                                        onClick={() => toggleSelectOne(tx.id)}
                                                    >
                                                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                            <div className={cn(
                                                                "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center shadow-neu-inset-deep",
                                                                tx.is_transfer
                                                                    ? "text-indigo-500"
                                                                    : isIncome
                                                                        ? "text-neu-accent-sec"
                                                                        : "text-rose-500"
                                                            )}>
                                                                {tx.is_transfer ? (
                                                                    <ArrowRightLeft className="h-5 w-5" />
                                                                ) : isIncome ? (
                                                                    <ArrowUpRight className="h-5 w-5" />
                                                                ) : (
                                                                    <ArrowDownRight className="h-5 w-5" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-sm sm:text-base text-foreground truncate">{tx.name}</p>
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                                    <span className={cn(
                                                                        tx.is_transfer ? "text-indigo-500 font-bold" : isIncome ? "text-neu-accent-sec font-bold" : "text-rose-500 font-bold"
                                                                    )}>
                                                                        {tx.is_transfer ? 'Transfer' : cat?.name || t('common.uncategorized')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className={cn(
                                                            "font-bold font-mono text-base sm:text-lg shrink-0",
                                                            tx.is_transfer ? "text-indigo-500" : isIncome ? "text-neu-accent-sec" : "text-foreground"
                                                        )}>
                                                            {tx.is_transfer ? '' : isIncome ? '+' : '-'} <CurrencyDisplay value={Number(tx.amount)} />
                                                        </div>
                                                    </div>
                                                </SwipeableItem>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </PullToRefresh>

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[560px]">
                        <DialogHeader>
                            <DialogTitle>{t('transactions.edit_transaction')}</DialogTitle>
                            <DialogDescription>Perbarui data transaksi ini</DialogDescription>
                        </DialogHeader>
                        <TransactionForm
                            categories={categories}
                            accounts={accounts}
                            savings={savings}
                            onSubmit={handleSubmit}
                            isSubmitting={updateMutation.isPending}
                            initialData={editingTx}
                        />
                    </DialogContent>
                </Dialog>

                {/* Add Category Dialog */}
                <Dialog open={isCategoryAddOpen} onOpenChange={setIsCategoryAddOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{t('categories.add_category')}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCategorySubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('categories.name_label')}</Label>
                                <Input
                                    value={categoryFormData.name}
                                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                    placeholder={t('categories.name_placeholder')}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('categories.type_label')}</Label>
                                <div className="relative">
                                    <select
                                        className="appearance-none flex h-11 w-full rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-4 text-sm text-foreground font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary"
                                        value={categoryFormData.type}
                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, type: e.target.value as any })}
                                        required
                                    >
                                        <option value="expense">💸 {t('categories.expense')}</option>
                                        <option value="income">💰 {t('categories.income')}</option>
                                        <option value="saving">🏦 {t('categories.saving')}</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <Button type="submit" className="w-full mt-6 h-12 font-bold" disabled={createCategoryMutation.isPending}>
                                {createCategoryMutation.isPending ? t('categories.saving') : t('categories.save_btn')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Category Dialog */}
                <Dialog open={isCategoryEditOpen} onOpenChange={setIsCategoryEditOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{t('categories.edit_category')}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCategorySubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('categories.name_label')}</Label>
                                <Input
                                    value={categoryFormData.name}
                                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('categories.type_label')}</Label>
                                <div className="relative">
                                    <select
                                        className="appearance-none flex h-11 w-full rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-4 text-sm text-foreground font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary"
                                        value={categoryFormData.type}
                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, type: e.target.value as any })}
                                        required
                                    >
                                        <option value="expense">💸 {t('categories.expense')}</option>
                                        <option value="income">💰 {t('categories.income')}</option>
                                        <option value="saving">🏦 {t('categories.saving')}</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="pt-4 space-y-3">
                                <Button type="submit" className="w-full h-12 font-bold" disabled={updateCategoryMutation.isPending}>
                                    {updateCategoryMutation.isPending ? t('categories.updating') : t('categories.update_btn')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="w-full h-12 font-bold"
                                    onClick={() => setCategoryDeleteConfirmOpen(true)}
                                    disabled={deleteCategoryMutation.isPending}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> {t('categories.delete_btn')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('transactions.confirm_delete')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus data transaksi ini? Tindakan tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                                {t('common.delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Category Delete Confirmation */}
                <AlertDialog open={categoryDeleteConfirmOpen} onOpenChange={setCategoryDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('categories.delete_title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('categories.delete_confirm', { name: editingCategory?.name })}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmCategoryDelete} className="bg-destructive text-destructive-foreground">
                                {t('categories.delete_btn')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}

function TransactionForm({ categories, accounts, onSubmit, isSubmitting, initialData }: any) {
    const { t } = useTranslation();
    const { currency, language } = usePreferencesStore();
    const [formData, setFormData] = useState<Partial<Transaction>>({
        name: '',
        amount: 0,
        transaction_date: new Date().toISOString().split('T')[0],
        category_id: 0,
        account_id: 0,
        goal_id: 0
    });

    useEffect(() => {
        if (!initialData && accounts && accounts.length > 0 && formData.account_id === 0) {
            const defaultAccount = accounts.find((a: Account) => a.is_default);
            if (defaultAccount) {
                setFormData(prev => ({ ...prev, account_id: defaultAccount.id }));
            } else {
                setFormData(prev => ({ ...prev, account_id: accounts[0].id }));
            }
        }
    }, [accounts, initialData]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                amount: initialData.amount,
                transaction_date: initialData.transaction_date,
                category_id: initialData.category_id,
                account_id: initialData.account_id,
                goal_id: initialData.goal_id
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(e, formData);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
            {/* Amount Input Sunken Well */}
            <div className="p-6 rounded-3xl bg-background shadow-neu-inset-deep flex flex-col items-center justify-center">
                <Label htmlFor="amount" className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('transactions.total_amount')}</Label>
                <div className="flex items-baseline justify-center w-full">
                    <span className="text-2xl sm:text-3xl font-extrabold text-muted-foreground mr-2">{currency === 'USD' ? '$' : 'Rp'}</span>
                    <input
                        id="amount"
                        type="text"
                        inputMode="numeric"
                        className="text-3xl sm:text-5xl font-extrabold font-mono bg-transparent border-none text-center w-full focus:ring-0 placeholder:text-muted-foreground/30 p-0 outline-none text-foreground"
                        placeholder="0"
                        value={formData.amount ? Number(formData.amount).toLocaleString(language || 'id-ID') : ''}
                        onKeyDown={(e) => {
                            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                e.preventDefault();
                            }
                        }}
                        onChange={(e) => {
                            const rawValue = e.target.value.replace(/[^0-9]/g, '');
                            const numValue = parseInt(rawValue) || 0;
                            setFormData({ ...formData, amount: numValue });
                        }}
                        required
                        autoFocus
                    />
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {/* Account Select */}
                <div className="space-y-2">
                    <Label htmlFor="account" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-primary" /> {t('transactions.account')}
                    </Label>
                    <div className="relative">
                        <select
                            id="account"
                            className="appearance-none flex h-11 w-full rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-4 text-sm text-foreground font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary"
                            value={formData.account_id}
                            onChange={(e) => setFormData({ ...formData, account_id: Number(e.target.value) })}
                            required
                        >
                            <option value={0} disabled>{t('transactions.select_account')}</option>
                            {accounts?.map((acc: Account) => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({new Intl.NumberFormat(language || 'id-ID', { style: 'currency', currency: 'IDR' }).format(acc.balance)})</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                </div>

                {/* Category Select */}
                <div className="space-y-2">
                    <Label htmlFor="category" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-primary" /> {t('transactions.category')}
                    </Label>
                    <div className="relative">
                        <select
                            id="category"
                            className="appearance-none flex h-11 w-full rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-4 text-sm text-foreground font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary"
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                            required
                        >
                            <option value={0} disabled>{t('transactions.select_category')}</option>
                            {categories?.filter((c: any) => c.type !== 'saving').map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                </div>

                {/* Date Input */}
                <div className="space-y-2">
                    <Label htmlFor="date" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-primary" /> {t('transactions.date')}
                    </Label>
                    <Input
                        id="date"
                        type="date"
                        value={formData.transaction_date}
                        onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                        required
                    />
                </div>

                {/* Note Input */}
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <AlignLeft className="w-3.5 h-3.5 text-primary" /> {t('transactions.note')}
                    </Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('transactions.note_placeholder')}
                        required
                    />
                </div>
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 h-12 font-bold"
            >
                {isSubmitting ? t('transactions.saving') : t('transactions.save')}
            </Button>
        </form>
    );
}
