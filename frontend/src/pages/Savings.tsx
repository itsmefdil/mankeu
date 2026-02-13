import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type Saving, type Account, type Category } from '@/services/financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
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
import { Plus, Trash2, Pencil, PiggyBank, ArrowUpRight, ArrowDownLeft, Search, Wallet, Clock, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { useTranslation } from 'react-i18next';
import { usePreferencesStore } from '@/hooks/usePreferences';
import { PullToRefresh } from '@/components/PullToRefresh';
import { SwipeableItem } from '@/components/SwipeableItem';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Haptic feedback helper
const vibrate = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

export default function SavingsPage() {
    const { t } = useTranslation();
    const { language } = usePreferencesStore();
    const queryClient = useQueryClient();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Transaction state
    const [isTransactionOpen, setIsTransactionOpen] = useState(false);
    const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
    const [transactionAmount, setTransactionAmount] = useState<number>(0);
    const [transactionNotes, setTransactionNotes] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    // History sheet state
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [viewingSaving, setViewingSaving] = useState<Saving | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Saving>>({
        name: '',
        amount: 0,
        saving_date: new Date().toISOString().split('T')[0],
    });

    // Queries
    const { data: savings, isLoading } = useQuery({
        queryKey: ['savings'],
        queryFn: financialService.getSavings
    });

    const { data: accounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: financialService.getAccounts
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: financialService.getCategories
    });

    // Get saving transactions when viewing
    const { data: savingTransactions, isLoading: loadingTransactions } = useQuery({
        queryKey: ['savingTransactions', viewingSaving?.id],
        queryFn: () => viewingSaving ? financialService.getSavingTransactions(viewingSaving.id) : Promise.resolve([]),
        enabled: !!viewingSaving
    });

    // Filtered savings
    const filteredSavings = useMemo(() => {
        if (!savings) return [];
        return savings.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [savings, searchQuery]);

    // Total saved calculation
    const totalSaved = useMemo(() => {
        if (!savings) return 0;
        return savings.reduce((sum, s) => sum + Number(s.amount), 0);
    }, [savings]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: financialService.createSaving,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            setIsAddOpen(false);
            resetForm();
            vibrate([50, 30, 50]);
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number, saving: Partial<Saving> }) =>
            financialService.updateSaving(data.id, data.saving),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            setIsEditOpen(false);
            setEditingSaving(null);
            resetForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: financialService.deleteSaving,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            setDeleteConfirmOpen(false);
            setEditingSaving(null);
            setViewingSaving(null);
            setIsHistoryOpen(false);
        }
    });

    // Filter categories logic
    const availableCategories = useMemo(() => {
        if (!categories) return [];
        // User requested: "tampilkan kategori saving aja" for deposit
        if (transactionType === 'deposit') {
            return categories.filter(c => c.type === 'saving');
        }
        return categories.filter(c => c.type === 'income');
    }, [categories, transactionType]);

    const depositMutation = useMutation({
        mutationFn: (data: { id: number, amount: number, accountId: number, categoryId: number, notes?: string }) =>
            financialService.depositToSaving(data.id, data.amount, data.accountId, data.categoryId, data.notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] }); // Refresh accounts too
            queryClient.invalidateQueries({ queryKey: ['savingTransactions', viewingSaving?.id] });
            setIsTransactionOpen(false);
            resetTransactionForm();
            vibrate([50, 30, 50]);
        }
    });

    const withdrawMutation = useMutation({
        mutationFn: (data: { id: number, amount: number, accountId: number, categoryId: number, notes?: string }) =>
            financialService.withdrawFromSaving(data.id, data.amount, data.accountId, data.categoryId, data.notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['savingTransactions', viewingSaving?.id] });
            setIsTransactionOpen(false);
            resetTransactionForm();
            vibrate([50, 30, 50]);
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            amount: 0,
            saving_date: new Date().toISOString().split('T')[0],
        });
    };

    const resetTransactionForm = () => {
        setTransactionAmount(0);
        setTransactionNotes('');
        setSelectedAccountId(null);
        setSelectedCategoryId(null);
    };

    const handleEdit = (saving: Saving) => {
        setEditingSaving(saving);
        setFormData({
            name: saving.name,
            amount: Number(saving.amount),
            saving_date: saving.saving_date,
        });
        setIsEditOpen(true);
    };

    const handleDelete = () => {
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (editingSaving) {
            deleteMutation.mutate(editingSaving.id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSaving) {
            updateMutation.mutate({ id: editingSaving.id, saving: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const openSavingDetail = (saving: Saving) => {
        setViewingSaving(saving);
        setIsHistoryOpen(true);
    };

    const openDepositDialog = (saving: Saving) => {
        setViewingSaving(saving);
        setTransactionType('deposit');
        resetTransactionForm();
        setIsTransactionOpen(true);
    };

    const openWithdrawDialog = (saving: Saving) => {
        setViewingSaving(saving);
        setTransactionType('withdraw');
        resetTransactionForm();
        setIsTransactionOpen(true);
    };

    const handleTransactionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewingSaving || transactionAmount <= 0) return;
        if (!selectedAccountId || !selectedCategoryId) return;

        if (transactionType === 'deposit') {
            depositMutation.mutate({
                id: viewingSaving.id,
                amount: transactionAmount,
                accountId: selectedAccountId,
                categoryId: selectedCategoryId,
                notes: transactionNotes || undefined
            });
        } else {
            withdrawMutation.mutate({
                id: viewingSaving.id,
                amount: transactionAmount,
                accountId: selectedAccountId,
                categoryId: selectedCategoryId,
                notes: transactionNotes || undefined
            });
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(language, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(language, {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-20 md:pb-0">
                {/* Mobile FAB */}
                {!isDesktop && (
                    <Button
                        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg shadow-primary/30 z-40 p-0 hover:scale-105 active:scale-95 transition-all"
                        onClick={() => {
                            vibrate(10);
                            resetForm();
                            setIsAddOpen(true);
                        }}
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                )}

                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-display font-bold truncate">{t('savings.title')}</h1>
                        <p className="text-muted-foreground mt-1 text-sm hidden sm:block">{t('savings.description')}</p>
                    </div>
                    {isDesktop && (
                        <Button
                            className="shadow-lg shadow-primary/20 rounded-xl"
                            onClick={() => {
                                resetForm();
                                setIsAddOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> {t('savings.add_savings')}
                        </Button>
                    )}
                </div>

                {/* Summary Card */}
                <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white shadow-2xl shadow-emerald-500/25 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(255,255,255,0.15),transparent_50%)]" />
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <PiggyBank className="w-5 h-5" />
                            <p className="text-sm font-medium text-white/80 uppercase tracking-wider">{t('savings.total_saved')}</p>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold font-display tracking-tight drop-shadow-lg">
                            <CurrencyDisplay value={totalSaved} className="text-white" />
                        </h3>
                        <p className="text-xs text-white/60 mt-2">{savings?.length || 0} {t('savings.title').toLowerCase()}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9 h-11 bg-card border-none shadow-sm rounded-xl focus-visible:ring-1 transition-all"
                        placeholder={t('savings.name_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Savings List */}
                <PullToRefresh onRefresh={async () => {
                    await queryClient.invalidateQueries({ queryKey: ['savings'] });
                }}>
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">{t('savings.loading')}</div>
                        ) : filteredSavings.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-border rounded-xl">
                                <div className="flex flex-col items-center gap-2">
                                    <PiggyBank className="h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="text-lg font-semibold">{t('savings.no_savings')}</h3>
                                    <p className="text-muted-foreground text-sm">{t('savings.no_savings_desc')}</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 rounded-xl"
                                        onClick={() => {
                                            resetForm();
                                            setIsAddOpen(true);
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('savings.add_savings')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            filteredSavings.map((saving) => (
                                <div key={saving.id} className="animate-in fade-in slide-in-from-bottom-2">
                                    <SwipeableItem
                                        onSwipeLeft={() => {
                                            setEditingSaving(saving);
                                            setDeleteConfirmOpen(true);
                                        }}
                                        onSwipeRight={() => handleEdit(saving)}
                                        vibrate={() => vibrate(10)}
                                        leftContent={<Trash2 className="w-5 h-5 text-white" />}
                                        rightContent={<Pencil className="w-5 h-5 text-white" />}
                                        className="p-4 rounded-2xl border border-border bg-card shadow-sm transition-all"
                                    >
                                        {/* Click on header to see history */}
                                        <div
                                            className="flex items-center justify-between mb-4 cursor-pointer group"
                                            onClick={() => openSavingDetail(saving)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                                                    <PiggyBank className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-base group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                                                        {saving.name}
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(saving.saving_date)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                                    <CurrencyDisplay value={Number(saving.amount)} />
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDepositDialog(saving);
                                                }}
                                            >
                                                <ArrowUpRight className="w-4 h-4 mr-1.5" />
                                                {t('savings.deposit')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/30"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openWithdrawDialog(saving);
                                                }}
                                            >
                                                <ArrowDownLeft className="w-4 h-4 mr-1.5" />
                                                {t('savings.withdraw')}
                                            </Button>
                                        </div>
                                    </SwipeableItem>
                                </div>
                            ))
                        )}
                    </div>
                </PullToRefresh>

                {/* History Sheet */}
                <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                        <SheetHeader className="mb-6 pt-[calc(1rem+env(safe-area-inset-top))]">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                                    <PiggyBank className="h-6 w-6" />
                                </div>
                                <div>
                                    <SheetTitle>{viewingSaving?.name}</SheetTitle>
                                    <SheetDescription>
                                        <CurrencyDisplay value={Number(viewingSaving?.amount || 0)} />
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>

                        {/* Quick Actions in Sheet */}
                        <div className="flex gap-2 mb-6">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
                                onClick={() => viewingSaving && openDepositDialog(viewingSaving)}
                            >
                                <ArrowUpRight className="w-4 h-4 mr-1.5" />
                                {t('savings.deposit')}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:text-rose-400"
                                onClick={() => viewingSaving && openWithdrawDialog(viewingSaving)}
                            >
                                <ArrowDownLeft className="w-4 h-4 mr-1.5" />
                                {t('savings.withdraw')}
                            </Button>
                        </div>

                        {/* Transaction History */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {t('savings.recent_transactions')}
                            </h4>

                            {loadingTransactions ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('savings.loading')}
                                </div>
                            ) : savingTransactions?.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-border rounded-xl">
                                    <Clock className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                                    <p className="text-sm text-muted-foreground">{t('savings.no_transactions')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {savingTransactions?.map((tx) => (
                                        <div
                                            key={tx.id}
                                            className="flex items-stretch gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-sm"
                                        >
                                            <div className={cn(
                                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                                tx.type === 'deposit'
                                                    ? "bg-emerald-500/10 text-emerald-600"
                                                    : "bg-rose-500/10 text-rose-600"
                                            )}>
                                                {tx.type === 'deposit'
                                                    ? <ArrowUpRight className="w-5 h-5" />
                                                    : <ArrowDownLeft className="w-5 h-5" />
                                                }
                                            </div>

                                            <div className="flex flex-col flex-1 min-w-0 gap-1">
                                                {/* Top Row: Title */}
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-sm">
                                                        {tx.type === 'deposit' ? t('savings.deposit') : t('savings.withdraw')}
                                                    </p>
                                                </div>

                                                {/* Bottom Row: Date/Notes and Amount */}
                                                <div className="flex items-center justify-between gap-2 text-xs">
                                                    <div className="flex items-center gap-2 text-muted-foreground truncate min-w-0 flex-1">
                                                        <span>{formatDateTime(tx.created_at)}</span>
                                                        {tx.notes && <span className="truncate opacity-70">• {tx.notes}</span>}
                                                    </div>

                                                    <p className={cn(
                                                        "font-bold tabular-nums shrink-0",
                                                        tx.type === 'deposit' ? "text-emerald-600" : "text-rose-600"
                                                    )}>
                                                        {tx.type === 'deposit' ? '+' : '-'}
                                                        <CurrencyDisplay value={tx.amount} />
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Add Saving Dialog */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className={cn(
                        "flex flex-col gap-0 p-0 overflow-hidden",
                        "w-full sm:w-auto h-full sm:h-auto",
                        "sm:max-w-[425px] sm:rounded-2xl",
                        "border-0 sm:border"
                    )}>
                        <DialogHeader className="px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-border/50 shrink-0">
                            <DialogTitle>{t('savings.add_savings')}</DialogTitle>
                            <DialogDescription>{t('savings.add_savings_desc')}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-background">
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                                {/* Name Input */}
                                <div className="relative py-4 sm:py-6 bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                                        {t('savings.name_label')}
                                    </Label>
                                    <div className="w-full px-4 sm:px-8">
                                        <input
                                            type="text"
                                            className="text-xl sm:text-2xl font-bold bg-transparent border-none text-center w-full focus:ring-0 placeholder:text-muted-foreground/30 p-0 outline-none"
                                            placeholder={t('savings.name_placeholder')}
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Initial Amount Input */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <PiggyBank className="w-4 h-4 text-primary" /> {t('savings.current_amount')}
                                    </Label>
                                    <Input
                                        type="number"
                                        className="h-12 rounded-xl border-input bg-card text-base shadow-sm"
                                        value={formData.amount || ''}
                                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 pb-6 px-6 border-t border-border">
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-semibold shadow-lg rounded-xl"
                                    disabled={createMutation.isPending}
                                >
                                    {createMutation.isPending ? t('savings.saving') : t('savings.save_btn')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Saving Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className={cn(
                        "flex flex-col gap-0 p-0 overflow-hidden",
                        "w-full sm:w-auto h-full sm:h-auto",
                        "sm:max-w-[425px] sm:rounded-2xl",
                        "border-0 sm:border"
                    )}>
                        <DialogHeader className="px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-border/50 shrink-0">
                            <DialogTitle>{t('savings.edit_savings')}</DialogTitle>
                            <DialogDescription>{t('savings.edit_savings_desc')}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-background">
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                                {/* Name Input */}
                                <div className="relative py-4 sm:py-6 bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                                        {t('savings.name_label')}
                                    </Label>
                                    <div className="w-full px-4 sm:px-8">
                                        <input
                                            type="text"
                                            className="text-xl sm:text-2xl font-bold bg-transparent border-none text-center w-full focus:ring-0 placeholder:text-muted-foreground/30 p-0 outline-none"
                                            placeholder={t('savings.name_placeholder')}
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 pb-6 px-6 border-t border-border space-y-3">
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-semibold shadow-lg rounded-xl"
                                    disabled={updateMutation.isPending}
                                >
                                    {updateMutation.isPending ? t('savings.updating') : t('savings.update_btn')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full h-12 text-base font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {deleteMutation.isPending ? t('savings.deleting') : t('savings.delete_btn')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Deposit/Withdraw Dialog */}
                <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
                    <DialogContent className={cn(
                        "flex flex-col gap-0 p-0 overflow-hidden",
                        "w-full sm:w-auto h-full sm:h-auto",
                        "sm:max-w-[425px] sm:rounded-2xl",
                        "border-0 sm:border"
                    )}>
                        <DialogHeader className={cn(
                            "px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-border/50 shrink-0",
                            transactionType === 'deposit'
                                ? "bg-gradient-to-r from-emerald-500/10 to-transparent"
                                : "bg-gradient-to-r from-rose-500/10 to-transparent"
                        )}>
                            <DialogTitle className="flex items-center gap-2">
                                {transactionType === 'deposit' ? (
                                    <>
                                        <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                                        {t('savings.deposit')}
                                    </>
                                ) : (
                                    <>
                                        <ArrowDownLeft className="h-5 w-5 text-rose-600" />
                                        {t('savings.withdraw')}
                                    </>
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                {viewingSaving?.name} - <CurrencyDisplay value={Number(viewingSaving?.amount || 0)} />
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleTransactionSubmit} className="flex flex-col h-full bg-background">
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                                {/* Amount Input */}
                                <div className={cn(
                                    "relative py-6 sm:py-8 rounded-2xl border border-dashed flex flex-col items-center justify-center",
                                    transactionType === 'deposit'
                                        ? "bg-emerald-500/5 border-emerald-200 dark:border-emerald-800"
                                        : "bg-rose-500/5 border-rose-200 dark:border-rose-800"
                                )}>
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                                        {transactionType === 'deposit' ? t('savings.deposit') : t('savings.withdraw')}
                                    </Label>
                                    <div className="flex items-center justify-center gap-1">
                                        <span className={cn(
                                            "text-2xl font-bold",
                                            transactionType === 'deposit' ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {transactionType === 'deposit' ? '+' : '-'}
                                        </span>
                                        <input
                                            type="number"
                                            className={cn(
                                                "text-3xl sm:text-4xl font-bold bg-transparent border-none text-center w-40 focus:ring-0 placeholder:text-muted-foreground/30 p-0 outline-none",
                                                transactionType === 'deposit' ? "text-emerald-600" : "text-rose-600"
                                            )}
                                            placeholder="0"
                                            value={transactionAmount || ''}
                                            onChange={(e) => setTransactionAmount(Number(e.target.value))}
                                            required
                                            autoFocus
                                            min="1"
                                            max={transactionType === 'withdraw' ? Number(viewingSaving?.amount || 0) : undefined}
                                        />
                                    </div>
                                </div>

                                {/* Account Select */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-muted-foreground" /> {t('savings.source_account') || 'Akun'}
                                    </Label>
                                    <div className="relative">
                                        <select
                                            className="appearance-none flex h-12 w-full items-center justify-between rounded-xl border border-input bg-card px-4 py-2 text-base shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 relative z-10"
                                            value={selectedAccountId || ''}
                                            onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                                            required
                                        >
                                            <option value="" disabled>{t('common.select_account') || 'Pilih Akun'}</option>
                                            {accounts?.map((acc: Account) => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.name} ({acc.type}) - {Number(acc.balance).toLocaleString(language || 'id-ID', { style: 'currency', currency: 'IDR' })}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-0 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Category Select */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <Search className="w-4 h-4 text-muted-foreground" /> {t('transactions.category') || 'Kategori'}
                                    </Label>
                                    <div className="relative">
                                        <select
                                            className="appearance-none flex h-12 w-full items-center justify-between rounded-xl border border-input bg-card px-4 py-2 text-base shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 relative z-10"
                                            value={selectedCategoryId || ''}
                                            onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                                            required
                                        >
                                            <option value="" disabled>{t('transactions.select_category') || 'Pilih Kategori'}</option>
                                            {availableCategories?.map((cat: Category) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-0 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Notes Input */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" /> Catatan (opsional)
                                    </Label>
                                    <Input
                                        type="text"
                                        className="h-12 rounded-xl border-input bg-card text-base shadow-sm"
                                        value={transactionNotes}
                                        onChange={(e) => setTransactionNotes(e.target.value)}
                                        placeholder="cth. Gaji bulanan"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 pb-6 px-6 border-t border-border">
                                <Button
                                    type="submit"
                                    className={cn(
                                        "w-full h-12 text-base font-semibold shadow-lg rounded-xl",
                                        transactionType === 'deposit'
                                            ? "bg-emerald-600 hover:bg-emerald-700"
                                            : "bg-rose-600 hover:bg-rose-700"
                                    )}
                                    disabled={depositMutation.isPending || withdrawMutation.isPending || transactionAmount <= 0}
                                >
                                    {(depositMutation.isPending || withdrawMutation.isPending)
                                        ? t('savings.saving')
                                        : transactionType === 'deposit'
                                            ? t('savings.deposit')
                                            : t('savings.withdraw')
                                    }
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-3">
                                <div className="p-2 bg-destructive/10 rounded-lg">
                                    <Trash2 className="h-5 w-5 text-destructive" />
                                </div>
                                {t('savings.delete_btn')}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-base">
                                {t('savings.delete_confirm')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2 sm:gap-0">
                            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                            >
                                {deleteMutation.isPending ? t('savings.deleting') : t('savings.delete_btn')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}
