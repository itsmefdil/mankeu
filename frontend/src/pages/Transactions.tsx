
import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type Transaction } from '@/services/financial';
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

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Plus, Trash2, Pencil, Filter, Calendar as CalendarIcon, Target, ChevronDown, Tag, AlignLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SwipeableItem } from '@/components/SwipeableItem';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useTranslation } from 'react-i18next';
import { usePreferencesStore } from '@/hooks/usePreferences';

// Haptic feedback helper
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

    // Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return transactions?.filter(tx => {
            const matchesSearch = tx.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'all' || tx.category_id === Number(filterCategory);

            const txDate = new Date(tx.transaction_date);
            const matchesDate = txDate.getMonth() + 1 === filterMonth && txDate.getFullYear() === filterYear;

            return matchesSearch && matchesCategory && matchesDate;
        }).sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    }, [transactions, searchQuery, filterCategory, filterMonth, filterYear]);



    // Grouping
    const groupedTransactions = useMemo(() => {
        if (!filteredTransactions) return {};
        return filteredTransactions.reduce((acc, tx) => {
            const date = tx.transaction_date;
            if (!acc[date]) acc[date] = [];
            acc[date].push(tx);
            return acc;
        }, {} as Record<string, Transaction[]>);
    }, [filteredTransactions]);

    // Daily Expense Calculation
    const todayExpense = useMemo(() => {
        if (!transactions || !categories) return 0;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // Compare using YYYY-MM-DD string from API

        return transactions
            .filter(tx => {
                const isToday = tx.transaction_date === todayStr;
                const category = categories.find(c => c.id === tx.category_id);
                // Use strict check for 'expense' type
                const isExpense = category?.type === 'expense';
                return isToday && isExpense;
            })
            .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    }, [transactions, categories]);

    // Average Daily Expense Calculation
    const avgDailyExpense = useMemo(() => {
        if (!transactions || !categories) return 0;
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const currentDayOf = today.getDate(); // 1-31

        const totalMonthExpense = transactions
            .filter(tx => {
                const date = new Date(tx.transaction_date);
                const category = categories.find(c => c.id === tx.category_id);
                const isExpense = category?.type === 'expense';

                return isExpense &&
                    date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear &&
                    date.getDate() <= currentDayOf; // Only count up to today for fairness? Or just total month to date.
            })
            .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

        // Avoid division by zero, though getDate() is min 1
        return totalMonthExpense / Math.max(1, currentDayOf);
    }, [transactions, categories]);


    // Mutations
    const createMutation = useMutation({
        mutationFn: financialService.createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            setIsAddOpen(false);
            vibrate([50, 30, 50]); // Success pattern
        },
        onError: () => {
            vibrate(200); // Error pattern
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number, tx: Partial<Transaction> }) => financialService.updateTransaction(data.id, data.tx),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            setIsEditOpen(false);
            setEditingTx(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: financialService.deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: financialService.bulkDeleteTransactions,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            setSelectedIds([]);
        }
    });



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

        // Convert goal_id to undefined if 0 (select placeholder)
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
            setSelectedIds(filteredTransactions?.map(tx => tx.id) || []);
        }
    };

    const toggleSelectOne = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
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
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return t('transactions.today');
        if (date.toDateString() === yesterday.toDateString()) return t('transactions.yesterday');

        return date.toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' });
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full pb-20 md:pb-0">
                {/* Mobile FAB */}
                {!isDesktop && (
                    <Button
                        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg shadow-primary/30 z-40 p-0 hover:scale-105 active:scale-95 transition-all"
                        onClick={() => {
                            vibrate(10);
                            setIsAddOpen(true);
                        }}
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                )}
                {/* Header */}
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-display font-bold truncate">{t('transactions.title')}</h1>
                        <p className="text-muted-foreground mt-1 text-sm hidden sm:block">{t('transactions.description')}</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        {selectedIds.length > 0 && (
                            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending} className="animate-in fade-in zoom-in-95 rounded-xl shadow-sm">
                                <Trash2 className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">{t('transactions.delete')}</span> ({selectedIds.length})
                            </Button>
                        )}
                        {/* Add Transaction Dialog - Unified Responsive */}
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                {isDesktop ? (
                                    <Button className="shadow-lg shadow-primary/20 rounded-xl"><Plus className="mr-2 h-4 w-4" /> {t('transactions.new_transaction')}</Button>
                                ) : (
                                    <Button className="shadow-lg shadow-primary/20 rounded-xl px-4 hidden">
                                        <Plus className="h-5 w-5 sm:mr-2" />
                                        <span className="sr-only sm:not-sr-only">{t('transactions.new_transaction')}</span>
                                        <span className="sm:hidden font-semibold">{t('transactions.new')}</span>
                                    </Button>
                                )}
                            </DialogTrigger>
                            <DialogContent className={cn(
                                "flex flex-col gap-0 p-0 overflow-hidden",
                                "w-full sm:w-auto h-full sm:h-auto", // Mobile: Fullscreen, Desktop: Auto height
                                "sm:max-w-[600px] sm:rounded-2xl", // Desktop: Wider and rounded
                                "border-0 sm:border" // Mobile: No border
                            )}>
                                <DialogHeader className="px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-border/50 shrink-0">
                                    <DialogTitle>{t('transactions.add_transaction')}</DialogTitle>
                                    <DialogDescription>{t('transactions.add_description')}</DialogDescription>
                                </DialogHeader>
                                <TransactionForm
                                    categories={categories}
                                    savings={savings}
                                    onSubmit={handleSubmit}
                                    isSubmitting={createMutation.isPending}
                                    initialData={null}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Filters & Actions */}
                {/* Daily Expense Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                                <Tag className="w-3 h-3 text-red-600 dark:text-red-400" />
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t('transactions.today_expense')}</p>
                            </div>
                            <p className="text-sm font-bold font-mono text-red-600 dark:text-red-400">
                                <CurrencyDisplay value={todayExpense} />
                            </p>
                        </div>
                        <div className="h-px bg-slate-100 dark:bg-slate-700" />
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t('transactions.avg_daily')}</p>
                            <p className="text-sm font-bold font-mono text-red-600/80 dark:text-red-400/80">
                                <CurrencyDisplay value={avgDailyExpense} />
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-9 h-11 bg-card border-none shadow-sm rounded-xl focus-visible:ring-1 transition-all"
                                placeholder={t('transactions.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            variant={showFilters ? "secondary" : "outline"}
                            size="icon"
                            className="h-11 w-11 rounded-xl shadow-sm border-none bg-card hover:bg-muted/50 shrink-0"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-2 sm:flex gap-2 animate-in slide-in-from-top-2">
                            <select
                                className="h-10 w-full sm:w-auto rounded-xl border-none bg-card px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="all">{t('transactions.all_categories')}</option>
                                {categories?.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <select
                                className="h-10 w-full sm:w-auto rounded-xl border-none bg-card px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(Number(e.target.value))}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString(language, { month: 'short' })}</option>
                                ))}
                            </select>
                            <select
                                className="h-10 w-full sm:w-auto rounded-xl border-none bg-card px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                                value={filterYear}
                                onChange={(e) => setFilterYear(Number(e.target.value))}
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="selectAll"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                checked={filteredTransactions && filteredTransactions.length > 0 && selectedIds.length === filteredTransactions.length}
                                onChange={toggleSelectAll}
                            />
                            <label htmlFor="selectAll" className="text-sm font-medium leading-none cursor-pointer text-muted-foreground select-none">
                                {t('transactions.select_all')}
                            </label>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                            {filteredTransactions?.length || 0} {t('transactions.count_suffix')}
                        </span>
                    </div>
                </div>

                <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries({ queryKey: ['transactions'] }); }}>
                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">{t('transactions.loading')}</div>
                        ) : Object.keys(groupedTransactions).length === 0 ? (
                            <div className="text-center py-12">
                                <div className="bg-muted/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold">{t('transactions.no_transactions')}</h3>
                                <p className="text-muted-foreground">{t('transactions.no_transactions_desc')}</p>
                            </div>
                        ) : (
                            Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map((date) => (
                                <div key={date} className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 ml-3">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[9px] top-6 h-4 w-4 rounded-full border-4 border-background bg-slate-300 dark:bg-slate-600 z-10" />

                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-4 mb-2 flex items-center justify-between group">
                                            <h3 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
                                                {formatDateHeader(date)}
                                            </h3>
                                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary/50 text-muted-foreground group-hover:bg-secondary transition-colors">
                                                {groupedTransactions[date].length} {t('transactions.count_suffix')}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-3 pb-6">
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
                                                            "group relative flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden",
                                                            selectedIds.includes(tx.id) && "ring-2 ring-primary bg-primary/5",
                                                        )}
                                                    >
                                                        {/* Selection Indicator Bar */}
                                                        {selectedIds.includes(tx.id) && (
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                                        )}

                                                        <div className="flex items-center gap-4 min-w-0 flex-1 z-10" onClick={() => toggleSelectOne(tx.id)}>
                                                            <div className={cn(
                                                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300",
                                                                selectedIds.includes(tx.id)
                                                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
                                                                    : "bg-secondary/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-110"
                                                            )}>
                                                                {selectedIds.includes(tx.id) ? (
                                                                    <div className="h-3 w-3 rounded-sm bg-current" />
                                                                ) : (
                                                                    // Use category icon here if available, else first letter
                                                                    <span className="text-sm font-bold uppercase">{cat?.name?.[0] || '?'}</span>
                                                                )}
                                                            </div>
                                                            <div className="grid gap-1 min-w-0">
                                                                <div className="font-semibold text-base flex items-center gap-2 truncate">
                                                                    <span className="truncate">{tx.name}</span>
                                                                    {tx.goal_id && (
                                                                        <span className="inline-flex shrink-0 items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20">
                                                                            <Target className="w-2.5 h-2.5 mr-1" /> {t('transactions.goal')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                                                                    <span className={cn(
                                                                        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                                                                        isIncome
                                                                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-900/30"
                                                                            : "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-900/20 dark:text-rose-400 dark:ring-rose-900/30"
                                                                    )}>
                                                                        {cat?.name || 'Uncategorized'}
                                                                    </span>
                                                                    {tx.notes && <span className="truncate opacity-70">• {tx.notes}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0 ml-4 z-10" onClick={() => toggleSelectOne(tx.id)}>
                                                            <div className="flex flex-col items-end">
                                                                <span className={cn("text-base font-bold tabular-nums tracking-tight", isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                                                    {isIncome ? '+' : '-'}<CurrencyDisplay value={tx.amount} />
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </SwipeableItem>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </PullToRefresh>

                {/* Edit Dialog - Unified Responsive */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className={cn(
                        "flex flex-col gap-0 p-0 overflow-hidden",
                        "w-full sm:w-auto h-full sm:h-auto", // Mobile: Fullscreen, Desktop: Auto
                        "sm:max-w-[600px] sm:rounded-2xl", // Desktop styling
                        "border-0 sm:border"
                    )}>
                        <DialogHeader className="px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-border/50 shrink-0">
                            <DialogTitle>{t('transactions.edit_transaction')}</DialogTitle>
                        </DialogHeader>
                        <TransactionForm
                            categories={categories}
                            savings={savings}
                            onSubmit={handleSubmit}
                            isSubmitting={updateMutation.isPending}
                            initialData={editingTx}
                        />
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-3">
                                <div className="p-2 bg-destructive/10 rounded-lg">
                                    <Trash2 className="h-5 w-5 text-destructive" />
                                </div>
                                {t('transactions.confirm_delete')}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-base">
                                {deleteTarget?.type === 'bulk'
                                    ? t('transactions.delete_bulk_confirm', { count: selectedIds.length })
                                    : t('transactions.delete_single_confirm')
                                }
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2 sm:gap-0">
                            <AlertDialogCancel className="rounded-xl">{t('transactions.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                            >
                                {deleteMutation.isPending || bulkDeleteMutation.isPending ? t('transactions.deleting') : t('transactions.delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </div>
        </DashboardLayout>
    );
}



function TransactionForm({ categories, savings, onSubmit, isSubmitting, initialData }: any) {
    const { t } = useTranslation();
    const { currency, language } = usePreferencesStore();
    const [formData, setFormData] = useState<Partial<Transaction>>({
        name: '',
        amount: 0,
        transaction_date: new Date().toISOString().split('T')[0],
        category_id: 0,
        goal_id: 0
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                amount: initialData.amount,
                transaction_date: initialData.transaction_date,
                category_id: initialData.category_id,
                goal_id: initialData.goal_id
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(e, formData);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-background">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

                {/* 1. Amount Input */}
                <div className="relative py-8 bg-muted/20 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center">
                    <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{t('transactions.total_amount')}</Label>
                    <div className="flex items-baseline justify-center relative w-full px-4 sm:px-8">
                        <span className="text-2xl sm:text-3xl font-bold text-muted-foreground mr-2">{currency === 'USD' ? '$' : 'Rp'}</span>
                        <input
                            id="amount"
                            type="text"
                            inputMode="numeric"
                            className="text-4xl sm:text-5xl font-bold bg-transparent border-none text-center w-full focus:ring-0 placeholder:text-muted-foreground/20 p-0 outline-none hover:outline-none"
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

                <div className="grid gap-6 sm:grid-cols-2">
                    {/* 2. Category Select */}
                    <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <Tag className="w-4 h-4 text-primary" /> {t('transactions.category')}
                        </Label>
                        <div className="relative">
                            <select
                                id="category"
                                className="appearance-none flex h-12 w-full items-center justify-between rounded-xl border border-input bg-card px-4 py-2 text-base shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 relative z-10"
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                                required
                            >
                                <option value={0} disabled>{t('transactions.select_category')}</option>
                                {categories?.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.icon || '🔹'} {c.name} ({c.type})</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-0 pointer-events-none" />
                        </div>
                    </div>

                    {/* 3. Date Input */}
                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <CalendarIcon className="w-4 h-4 text-primary" /> {t('transactions.date')}
                        </Label>
                        <div className="relative">
                            <Input
                                id="date"
                                type="date"
                                className="h-12 rounded-xl border-input bg-card text-base font-medium cursor-pointer shadow-sm"
                                value={formData.transaction_date}
                                onClick={(e: any) => {
                                    if (e.currentTarget.showPicker) {
                                        e.currentTarget.showPicker();
                                    }
                                }}
                                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Note Input */}
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <AlignLeft className="w-4 h-4 text-primary" /> {t('transactions.note')}
                    </Label>
                    <Input
                        id="name"
                        className="h-12 rounded-xl border-input bg-card text-base shadow-sm"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('transactions.note_placeholder')}
                        required
                    />
                </div>

                {/* 5. Goal Link (Optional) */}
                {categories?.find((c: any) => c.id === formData.category_id)?.type === 'saving' && (
                    <div className="animate-in fade-in slide-in-from-top-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-dashed border-blue-200 dark:border-blue-800">
                        <Label htmlFor="goal" className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold mb-2">
                            <Target className="w-4 h-4" /> {t('transactions.link_goal')}
                        </Label>
                        <div className="relative">
                            <select
                                id="goal"
                                className="appearance-none flex h-12 w-full rounded-xl border border-blue-200 dark:border-blue-800 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                value={formData.goal_id || 0}
                                onChange={(e) => {
                                    const goalId = Number(e.target.value);
                                    const goal = savings?.find((s: any) => s.id === goalId);
                                    setFormData({
                                        ...formData,
                                        goal_id: goalId,
                                        name: goal ? `${t('transactions.deposit_to')} ` + goal.name : formData.name
                                    });
                                }}
                            >
                                <option value={0}>{t('transactions.select_goal')}</option>
                                {savings?.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name} (Current: {Math.floor(Number(s.amount)).toLocaleString('id-ID')})</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 pointer-events-none" />
                        </div>
                    </div>
                )}
            </div>

            <div className="shrink-0 p-6 bg-background border-t border-border/50">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 sm:h-14 text-lg rounded-xl sm:rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    {isSubmitting ? t('transactions.saving') : t('transactions.save')}
                </Button>
            </div>
        </form>
    )
}


