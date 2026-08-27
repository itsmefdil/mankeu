import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type Saving, type SavingTransaction, type Account } from '@/services/financial';
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
} from "@/components/ui/sheet"
import { Plus, Trash2, Pencil, PiggyBank, Calendar as CalendarIcon, Type, ArrowUpRight, ArrowDownLeft, Clock, ChevronRight, Search, ChevronDown, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { useTranslation } from 'react-i18next';
import { usePreferencesStore } from '@/hooks/usePreferences';
import { SwipeableItem } from '@/components/SwipeableItem';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useMediaQuery } from "@/hooks/useMediaQuery";

const vibrate = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

export default function SavingsPage() {
    const { t } = useTranslation();
    const { currency, language } = usePreferencesStore();
    const queryClient = useQueryClient();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Dialog States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Selected Saving for operations
    const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
    const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
    const [viewingSaving, setViewingSaving] = useState<Saving | null>(null);

    // Filter & Search
    const [searchQuery, setSearchQuery] = useState('');

    // Form States
    const [formData, setFormData] = useState<Partial<Saving>>({
        name: '',
        amount: 0,
        saving_date: new Date().toISOString().split('T')[0],
    });

    const [txFormData, setTxFormData] = useState<{ amount: number; notes: string; account_id?: number }>({
        amount: 0,
        notes: '',
        account_id: undefined,
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

    const { data: savingTransactions, isLoading: loadingTransactions } = useQuery({
        queryKey: ['savingTransactions', viewingSaving?.id],
        queryFn: () => viewingSaving ? financialService.getSavingTransactions(viewingSaving.id) : Promise.resolve([]),
        enabled: !!viewingSaving,
    });

    // Computed
    const totalSaved = useMemo(() => {
        if (!savings) return 0;
        return savings.reduce((acc, curr) => acc + Number(curr.amount), 0);
    }, [savings]);

    const filteredSavings = useMemo(() => {
        if (!savings) return [];
        return savings.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [savings, searchQuery]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: financialService.createSaving,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            setIsAddOpen(false);
            resetForm();
            vibrate([50, 30, 50]);
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number; saving: Partial<Saving> }) =>
            financialService.updateSaving(data.id, data.saving),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            setIsEditOpen(false);
            setEditingSaving(null);
            resetForm();
            vibrate(10);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: financialService.deleteSaving,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            setDeleteConfirmOpen(false);
            setEditingSaving(null);
            vibrate([50, 50]);
        }
    });

    const depositMutation = useMutation({
        mutationFn: (data: { id: number; amount: number; notes?: string; account_id?: number }) =>
            financialService.depositSaving(data.id, data.amount, data.notes, data.account_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['savingTransactions'] });
            setIsDepositOpen(false);
            resetTxForm();
            vibrate([50, 30, 50]);
        }
    });

    const withdrawMutation = useMutation({
        mutationFn: (data: { id: number; amount: number; notes?: string; account_id?: number }) =>
            financialService.withdrawSaving(data.id, data.amount, data.notes, data.account_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['savingTransactions'] });
            setIsWithdrawOpen(false);
            resetTxForm();
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

    const resetTxForm = () => {
        setTxFormData({
            amount: 0,
            notes: '',
            account_id: undefined,
        });
    };

    const handleEdit = (saving: Saving) => {
        setEditingSaving(saving);
        setFormData({
            name: saving.name,
            amount: saving.amount,
            saving_date: saving.saving_date,
        });
        setIsEditOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSaving) {
            updateMutation.mutate({ id: editingSaving.id, saving: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const openDepositDialog = (saving: Saving) => {
        setSelectedSaving(saving);
        resetTxForm();
        if (accounts && accounts.length > 0) {
            const defaultAcc = accounts.find((a: Account) => a.is_default) || accounts[0];
            setTxFormData(prev => ({ ...prev, account_id: defaultAcc.id }));
        }
        setIsDepositOpen(true);
    };

    const openWithdrawDialog = (saving: Saving) => {
        setSelectedSaving(saving);
        resetTxForm();
        if (accounts && accounts.length > 0) {
            const defaultAcc = accounts.find((a: Account) => a.is_default) || accounts[0];
            setTxFormData(prev => ({ ...prev, account_id: defaultAcc.id }));
        }
        setIsWithdrawOpen(true);
    };

    const openSavingDetail = (saving: Saving) => {
        setViewingSaving(saving);
        setIsHistoryOpen(true);
    };

    const handleDepositSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSaving || txFormData.amount <= 0) return;
        depositMutation.mutate({
            id: selectedSaving.id,
            amount: txFormData.amount,
            notes: txFormData.notes || undefined,
            account_id: txFormData.account_id,
        });
    };

    const handleWithdrawSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSaving || txFormData.amount <= 0) return;
        withdrawMutation.mutate({
            id: selectedSaving.id,
            amount: txFormData.amount,
            notes: txFormData.notes || undefined,
            account_id: txFormData.account_id,
        });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(language, { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(language, {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                            resetForm();
                            setIsAddOpen(true);
                        }}
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                )}

                {/* Action */}
                <div className="flex items-center justify-end">
                    <Button
                        onClick={() => {
                            resetForm();
                            setIsAddOpen(true);
                        }}
                        className="font-semibold gap-2 hidden sm:flex"
                    >
                        <Plus className="h-4 w-4" /> {t('savings.add_savings')}
                    </Button>
                </div>

                {/* Summary Vault Card */}
                <div className="p-6 sm:p-8 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary shrink-0">
                            <PiggyBank className="h-7 w-7" />
                        </div>
                        <div>
                            <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{t('savings.total_saved')}</span>
                            <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-foreground">
                                <CurrencyDisplay value={totalSaved} />
                            </h2>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-primary bg-background shadow-neu-inset-sm px-3.5 py-1.5 rounded-full hidden sm:inline-block">
                        {savings?.length || 0} Target Tabungan
                    </span>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        deep
                        className="pl-11 h-12 text-sm font-medium"
                        placeholder={t('savings.name_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Savings List */}
                <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries({ queryKey: ['savings'] }); }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {isLoading ? (
                            <div className="col-span-full text-center py-16 text-muted-foreground font-medium animate-pulse">{t('savings.loading')}</div>
                        ) : filteredSavings.length === 0 ? (
                            <div className="col-span-full p-12 rounded-[32px] bg-background shadow-neu-extruded flex flex-col items-center justify-center gap-4 text-center">
                                <div className="h-16 w-16 rounded-3xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary">
                                    <PiggyBank className="h-8 w-8 opacity-50" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-foreground">{t('savings.no_savings')}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{t('savings.no_savings_desc')}</p>
                                </div>
                                <Button
                                    className="mt-2 font-semibold"
                                    onClick={() => {
                                        resetForm();
                                        setIsAddOpen(true);
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> {t('savings.add_savings')}
                                </Button>
                            </div>
                        ) : (
                            filteredSavings.map((saving) => (
                                <SwipeableItem
                                    key={saving.id}
                                    onSwipeLeft={() => {
                                        setEditingSaving(saving);
                                        setDeleteConfirmOpen(true);
                                    }}
                                    onSwipeRight={() => handleEdit(saving)}
                                    vibrate={() => vibrate(10)}
                                    leftContent={<Trash2 className="w-5 h-5 text-white" />}
                                    rightContent={<Pencil className="w-5 h-5 text-white" />}
                                    className="p-6 rounded-[32px] bg-background shadow-neu-extruded hover:shadow-neu-extruded-hover transition-all duration-300 flex flex-col justify-between gap-5 h-full select-none"
                                >
                                    <div
                                        className="flex items-center justify-between cursor-pointer group"
                                        onClick={() => openSavingDetail(saving)}
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="h-12 w-12 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary shrink-0">
                                                <PiggyBank className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate flex items-center gap-1">
                                                    {saving.name} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                </h3>
                                                <p className="text-xs text-muted-foreground font-medium">{formatDate(saving.saving_date)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">Terkumpul</p>
                                        <p className="text-2xl font-extrabold font-display text-primary tracking-tight">
                                            <CurrencyDisplay value={Number(saving.amount)} />
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="font-bold text-xs gap-1"
                                            onClick={() => openDepositDialog(saving)}
                                        >
                                            <ArrowUpRight className="w-4 h-4 text-neu-accent-sec" />
                                            {t('savings.deposit')}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="font-bold text-xs gap-1"
                                            onClick={() => openWithdrawDialog(saving)}
                                        >
                                            <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                                            {t('savings.withdraw')}
                                        </Button>
                                    </div>
                                </SwipeableItem>
                            ))
                        )}
                    </div>
                </PullToRefresh>

                {/* History Sheet */}
                <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                        <SheetHeader className="mb-6">
                            <div className="flex items-center gap-3.5">
                                <div className="h-12 w-12 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary shrink-0">
                                    <PiggyBank className="h-6 w-6" />
                                </div>
                                <div>
                                    <SheetTitle className="text-xl font-bold font-display">{viewingSaving?.name}</SheetTitle>
                                    <SheetDescription className="font-mono text-base font-extrabold text-primary">
                                        <CurrencyDisplay value={Number(viewingSaving?.amount || 0)} />
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>

                        {/* Quick Actions in Sheet */}
                        <div className="flex gap-3 mb-6">
                            <Button
                                variant="secondary"
                                className="flex-1 font-bold gap-1.5"
                                onClick={() => viewingSaving && openDepositDialog(viewingSaving)}
                            >
                                <ArrowUpRight className="w-4 h-4 text-neu-accent-sec" />
                                {t('savings.deposit')}
                            </Button>
                            <Button
                                variant="secondary"
                                className="flex-1 font-bold gap-1.5"
                                onClick={() => viewingSaving && openWithdrawDialog(viewingSaving)}
                            >
                                <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                                {t('savings.withdraw')}
                            </Button>
                        </div>

                        {/* Transaction History */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Clock className="w-4 h-4" /> {t('savings.recent_transactions')}
                            </h4>

                            {loadingTransactions ? (
                                <div className="text-center py-8 text-muted-foreground font-medium animate-pulse">{t('savings.loading')}</div>
                            ) : savingTransactions?.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-border rounded-2xl">
                                    <p className="text-sm text-muted-foreground">{t('savings.no_transactions')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {savingTransactions?.map((tx: SavingTransaction) => (
                                        <div
                                            key={tx.id}
                                            className="flex items-center justify-between p-3.5 rounded-2xl bg-background shadow-neu-extruded-sm"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl shadow-neu-inset-sm flex items-center justify-center shrink-0",
                                                    tx.type === 'deposit' ? "text-neu-accent-sec" : "text-rose-500"
                                                )}>
                                                    {tx.type === 'deposit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-foreground">{tx.type === 'deposit' ? t('savings.deposit') : t('savings.withdraw')}</p>
                                                    <p className="text-[11px] text-muted-foreground font-medium truncate">{formatDateTime(tx.created_at)} {tx.notes && `• ${tx.notes}`}</p>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "font-bold font-mono text-sm shrink-0",
                                                tx.type === 'deposit' ? "text-neu-accent-sec" : "text-rose-500"
                                            )}>
                                                {tx.type === 'deposit' ? '+' : '-'} <CurrencyDisplay value={Number(tx.amount)} />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Add Saving Dialog */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{t('savings.add_savings')}</DialogTitle>
                            <DialogDescription>{t('savings.add_savings_desc')}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('savings.name_label')}</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t('savings.name_placeholder')}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('savings.amount_label')}</Label>
                                <Input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('savings.date_label')}</Label>
                                <Input
                                    type="date"
                                    value={formData.saving_date}
                                    onChange={(e) => setFormData({ ...formData, saving_date: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full mt-6 h-12 font-bold" disabled={createMutation.isPending}>
                                {createMutation.isPending ? t('savings.saving') : t('savings.save_btn')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Saving Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{t('savings.edit_savings')}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('savings.name_label')}</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('savings.amount_label')}</Label>
                                <Input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full mt-6 h-12 font-bold" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? t('savings.updating') : t('savings.update_btn')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Deposit Dialog */}
                <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{t('savings.deposit')} - {selectedSaving?.name}</DialogTitle>
                            <DialogDescription>Setor dana ke tabungan ini</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleDepositSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Wallet className="w-3.5 h-3.5 text-primary" /> {t('savings.source_account')}
                                </Label>
                                <div className="relative">
                                    <select
                                        className="appearance-none flex h-11 w-full rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-4 text-sm text-foreground font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary"
                                        value={txFormData.account_id || ''}
                                        onChange={(e) => setTxFormData({ ...txFormData, account_id: Number(e.target.value) })}
                                    >
                                        <option value="">{t('savings.no_account')}</option>
                                        {accounts?.map((acc: Account) => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({new Intl.NumberFormat(language || 'id-ID', { style: 'currency', currency: 'IDR' }).format(acc.balance)})</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('savings.deposit_amount')}</Label>
                                <Input
                                    type="number"
                                    deep
                                    className="h-14 text-2xl font-bold font-mono"
                                    value={txFormData.amount || ''}
                                    onChange={(e) => setTxFormData({ ...txFormData, amount: Number(e.target.value) })}
                                    placeholder="0"
                                    required
                                    min="1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('savings.notes_label')}</Label>
                                <Input
                                    value={txFormData.notes}
                                    onChange={(e) => setTxFormData({ ...txFormData, notes: e.target.value })}
                                    placeholder={t('savings.notes_placeholder')}
                                />
                            </div>
                            <Button type="submit" className="w-full mt-6 h-12 font-bold" disabled={depositMutation.isPending}>
                                {depositMutation.isPending ? t('savings.saving') : t('savings.deposit')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Withdraw Dialog */}
                <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{t('savings.withdraw')} - {selectedSaving?.name}</DialogTitle>
                            <DialogDescription>Tarik dana dari tabungan ini</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleWithdrawSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Wallet className="w-3.5 h-3.5 text-primary" /> {t('savings.destination_account')}
                                </Label>
                                <div className="relative">
                                    <select
                                        className="appearance-none flex h-11 w-full rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-4 text-sm text-foreground font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary"
                                        value={txFormData.account_id || ''}
                                        onChange={(e) => setTxFormData({ ...txFormData, account_id: Number(e.target.value) })}
                                    >
                                        <option value="">{t('savings.no_account')}</option>
                                        {accounts?.map((acc: Account) => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('savings.withdraw_amount')}</Label>
                                <Input
                                    type="number"
                                    deep
                                    className="h-14 text-2xl font-bold font-mono"
                                    value={txFormData.amount || ''}
                                    onChange={(e) => setTxFormData({ ...txFormData, amount: Number(e.target.value) })}
                                    placeholder="0"
                                    required
                                    min="1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('savings.notes_label')}</Label>
                                <Input
                                    value={txFormData.notes}
                                    onChange={(e) => setTxFormData({ ...txFormData, notes: e.target.value })}
                                    placeholder={t('savings.notes_placeholder')}
                                />
                            </div>
                            <Button type="submit" className="w-full mt-6 h-12 font-bold" disabled={withdrawMutation.isPending}>
                                {withdrawMutation.isPending ? t('savings.saving') : t('savings.withdraw')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('savings.delete_btn')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('savings.delete_confirm')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => editingSaving && deleteMutation.mutate(editingSaving.id)} className="bg-destructive text-destructive-foreground">
                                {t('common.delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}
