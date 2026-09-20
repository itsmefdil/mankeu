import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type Debt } from '@/services/financial';
import { Button } from '@/components/ui/button';
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
import { Plus, Trash2, Pencil, ChevronDown, User, Calendar, AlignLeft, ArrowDownLeft, ArrowUpRight, Check, CreditCard, Search, CheckCircle2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { useTranslation } from 'react-i18next';
import { usePreferencesStore } from '@/hooks/usePreferences';
import { SwipeableItem } from '@/components/SwipeableItem';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useMediaQuery } from "@/hooks/useMediaQuery";

type TabType = 'all' | 'payable' | 'receivable';
type StatusFilter = 'all' | 'active' | 'paid';

const vibrate = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

export default function DebtsPage() {
    const { t } = useTranslation();
    const { currency, language } = usePreferencesStore();
    const queryClient = useQueryClient();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // UI State
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Selected Debt for Edit/Payment/Delete
    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
    const [payingDebt, setPayingDebt] = useState<Debt | null>(null);

    // Form States
    const [formData, setFormData] = useState<Partial<Debt>>({
        type: 'payable',
        person_name: '',
        description: '',
        amount: 0,
        due_date: undefined,
    });

    const [paymentFormData, setPaymentFormData] = useState<{ amount: number; payment_date: string; notes?: string }>({
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    // Queries
    const { data: debts, isLoading } = useQuery<Debt[]>({
        queryKey: ['debts'],
        queryFn: () => financialService.getDebts()
    });

    // Computed Stats
    const stats = useMemo(() => {
        if (!debts) return { totalPayable: 0, totalReceivable: 0, unpaidPayable: 0, unpaidReceivable: 0 };

        let totalPayable = 0;
        let totalReceivable = 0;
        let unpaidPayable = 0;
        let unpaidReceivable = 0;

        debts.forEach(d => {
            const amount = Number(d.amount);
            const remaining = Number(d.remaining_amount);

            if (d.type === 'payable') {
                totalPayable += amount;
                if (!d.is_paid) unpaidPayable += remaining;
            } else {
                totalReceivable += amount;
                if (!d.is_paid) unpaidReceivable += remaining;
            }
        });

        return { totalPayable, totalReceivable, unpaidPayable, unpaidReceivable };
    }, [debts]);

    // Filtered Debts
    const filteredDebts = useMemo(() => {
        if (!debts) return [];

        return debts.filter(d => {
            if (activeTab !== 'all' && d.type !== activeTab) return false;
            if (statusFilter === 'active' && d.is_paid) return false;
            if (statusFilter === 'paid' && !d.is_paid) return false;

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchName = d.person_name.toLowerCase().includes(query);
                const matchDesc = d.description?.toLowerCase().includes(query);
                if (!matchName && !matchDesc) return false;
            }

            return true;
        }).sort((a, b) => {
            if (a.is_paid !== b.is_paid) return a.is_paid ? 1 : -1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [debts, activeTab, statusFilter, searchQuery]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: financialService.createDebt,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            setIsAddOpen(false);
            resetForm();
            vibrate([50, 30, 50]);
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number; debt: Partial<Debt> }) =>
            financialService.updateDebt(data.id, data.debt),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            setIsEditOpen(false);
            setSelectedDebt(null);
            resetForm();
            vibrate(10);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: financialService.deleteDebt,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            setDeleteConfirmOpen(false);
            setSelectedDebt(null);
            vibrate([50, 50]);
        }
    });

    const addPaymentMutation = useMutation({
        mutationFn: (data: { debtId: number; payment: { amount: number; payment_date: string; notes?: string } }) =>
            financialService.addDebtPayment(data.debtId, data.payment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            setIsPaymentOpen(false);
            setPayingDebt(null);
            resetPaymentForm();
            vibrate([50, 30, 50]);
        }
    });

    const togglePaidMutation = useMutation({
        mutationFn: (debt: Debt) =>
            financialService.updateDebt(debt.id, { is_paid: !debt.is_paid }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            vibrate(10);
        }
    });

    const resetForm = () => {
        setFormData({
            type: 'payable',
            person_name: '',
            description: '',
            amount: 0,
            due_date: undefined,
        });
    };

    const resetPaymentForm = () => {
        setPaymentFormData({
            amount: 0,
            payment_date: new Date().toISOString().split('T')[0],
            notes: '',
        });
    };

    const handleEdit = (debt: Debt) => {
        setSelectedDebt(debt);
        setFormData({
            type: debt.type,
            person_name: debt.person_name,
            description: debt.description || '',
            amount: Number(debt.amount),
            due_date: debt.due_date ? debt.due_date.split('T')[0] : undefined,
        });
        setIsEditOpen(true);
    };

    const handleOpenPayment = (debt: Debt) => {
        setPayingDebt(debt);
        setPaymentFormData({
            amount: Number(debt.remaining_amount),
            payment_date: new Date().toISOString().split('T')[0],
            notes: '',
        });
        setIsPaymentOpen(true);
    };

    const handleDelete = (debt: Debt) => {
        setSelectedDebt(debt);
        setDeleteConfirmOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedDebt) {
            updateMutation.mutate({ id: selectedDebt.id, debt: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!payingDebt || paymentFormData.amount <= 0) return;
        addPaymentMutation.mutate({
            debtId: payingDebt.id,
            payment: paymentFormData,
        });
    };

    const confirmDelete = () => {
        if (selectedDebt) {
            deleteMutation.mutate(selectedDebt.id);
        }
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
                {isDesktop && (
                    <div className="flex items-center justify-end">
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={resetForm} className="font-semibold gap-2">
                                    <Plus className="h-4 w-4" /> {t('debts.add_debt')}
                                </Button>
                            </DialogTrigger>
                            <DebtFormDialog
                                formData={formData}
                                setFormData={setFormData}
                                onSubmit={handleSubmit}
                                isSubmitting={createMutation.isPending}
                                isEdit={false}
                                currency={currency}
                                language={language}
                                t={t}
                            />
                        </Dialog>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Hutang (Payable) */}
                    <div className="p-6 sm:p-7 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-rose-500 shrink-0">
                                <ArrowDownLeft className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">{t('debts.type_payable')}</span>
                                <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-500 mt-1">
                                    <CurrencyDisplay value={stats.unpaidPayable} />
                                </h3>
                                <p className="text-xs text-muted-foreground font-medium mt-1">{t('debts.total_owed')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Piutang (Receivable) */}
                    <div className="p-6 sm:p-7 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-neu-accent-sec shrink-0">
                                <ArrowUpRight className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-neu-accent-sec uppercase tracking-wider">{t('debts.type_receivable')}</span>
                                <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-neu-accent-sec mt-1">
                                    <CurrencyDisplay value={stats.unpaidReceivable} />
                                </h3>
                                <p className="text-xs text-muted-foreground font-medium mt-1">{t('debts.total_receivable')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher & Status Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex bg-background p-1.5 rounded-2xl shadow-neu-inset dark:shadow-neu-dark-inset self-start">
                        {(['all', 'payable', 'receivable'] as TabType[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 capitalize",
                                    activeTab === tab
                                        ? "bg-background text-primary shadow-neu-extruded-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab === 'all' ? t('debts.tab_all') : tab === 'payable' ? t('debts.payable') : t('debts.receivable')}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {(['all', 'active', 'paid'] as StatusFilter[]).map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 capitalize",
                                    statusFilter === status
                                        ? "bg-background text-foreground shadow-neu-inset-sm"
                                        : "bg-background text-muted-foreground shadow-neu-extruded-sm hover:text-foreground"
                                )}
                            >
                                {status === 'all' ? t('debts.filter_all') : status === 'active' ? t('debts.filter_active') : t('debts.filter_paid')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        deep
                        className="pl-11 h-12 text-sm font-medium"
                        placeholder={t('debts.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Debts List */}
                <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries({ queryKey: ['debts'] }); }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {isLoading ? (
                            <div className="col-span-full text-center py-16 text-muted-foreground font-medium animate-pulse">{t('debts.loading')}</div>
                        ) : filteredDebts.length === 0 ? (
                            <div className="col-span-full p-12 rounded-[32px] bg-background shadow-neu-extruded flex flex-col items-center justify-center gap-4 text-center">
                                <div className="h-16 w-16 rounded-3xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary">
                                    <CreditCard className="h-8 w-8 opacity-50" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-foreground">{t('debts.no_debts')}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{t('debts.no_debts_desc')}</p>
                                </div>
                                <Button
                                    className="mt-2 font-semibold"
                                    onClick={() => {
                                        resetForm();
                                        setIsAddOpen(true);
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> {t('debts.add_debt')}
                                </Button>
                            </div>
                        ) : (
                            filteredDebts.map((debt) => {
                                const isPayable = debt.type === 'payable';
                                const percentPaid = Number(debt.amount) > 0
                                    ? Math.round(((Number(debt.amount) - Number(debt.remaining_amount)) / Number(debt.amount)) * 100)
                                    : 0;

                                return (
                                    <SwipeableItem
                                        key={debt.id}
                                        onSwipeLeft={() => handleDelete(debt)}
                                        onSwipeRight={() => handleEdit(debt)}
                                        vibrate={() => vibrate(10)}
                                        leftContent={<Trash2 className="w-5 h-5 text-white" />}
                                        rightContent={<Pencil className="w-5 h-5 text-white" />}
                                        className={cn(
                                            "p-6 rounded-[32px] bg-background shadow-neu-extruded hover:shadow-neu-extruded-hover transition-all duration-300 flex flex-col justify-between gap-5 h-full select-none",
                                            debt.is_paid && "opacity-60"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center shrink-0",
                                                    isPayable ? "text-rose-500" : "text-neu-accent-sec"
                                                )}>
                                                    {isPayable ? <ArrowDownLeft className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-lg text-foreground truncate">{debt.person_name}</h3>
                                                    <span className={cn(
                                                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-neu-inset-sm",
                                                        isPayable ? "text-rose-500" : "text-neu-accent-sec"
                                                    )}>
                                                        {isPayable ? t('debts.payable') : t('debts.receivable')}
                                                    </span>
                                                </div>
                                            </div>

                                            {debt.is_paid && (
                                                <span className="flex items-center gap-1 text-xs font-bold text-neu-accent-sec bg-background shadow-neu-inset-sm px-2.5 py-1 rounded-full">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                                                </span>
                                            )}
                                        </div>

                                        {debt.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">{debt.description}</p>
                                        )}

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-baseline text-xs">
                                                <span className="font-bold text-muted-foreground uppercase">{t('debts.remaining')}</span>
                                                <span className={cn("text-lg font-extrabold font-mono", isPayable ? "text-rose-500" : "text-neu-accent-sec")}>
                                                    <CurrencyDisplay value={Number(debt.remaining_amount)} />
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-2.5 w-full bg-background shadow-neu-inset-sm rounded-full overflow-hidden p-0.5">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000 shadow-neu-extruded-sm",
                                                        isPayable ? "bg-rose-500" : "bg-neu-accent-sec"
                                                    )}
                                                    style={{ width: `${percentPaid}%` }}
                                                />
                                            </div>

                                            <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                                                <span>{percentPaid}% {t('debts.paid_progress')}</span>
                                                <span>Total: <CurrencyDisplay value={Number(debt.amount)} /></span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-2.5 pt-2">
                                            {!debt.is_paid ? (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="font-bold text-xs gap-1"
                                                    onClick={() => handleOpenPayment(debt)}
                                                >
                                                    <DollarSign className="w-4 h-4 text-primary" /> {t('debts.add_payment')}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="font-bold text-xs"
                                                    onClick={() => togglePaidMutation.mutate(debt)}
                                                >
                                                    {t('debts.mark_unpaid')}
                                                </Button>
                                            )}

                                            {!debt.is_paid && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="font-bold text-xs"
                                                    onClick={() => togglePaidMutation.mutate(debt)}
                                                >
                                                    <Check className="w-4 h-4 text-neu-accent-sec mr-1" /> {t('debts.mark_paid')}
                                                </Button>
                                            )}
                                        </div>
                                    </SwipeableItem>
                                );
                            })
                        )}
                    </div>
                </PullToRefresh>

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DebtFormDialog
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleSubmit}
                        isSubmitting={updateMutation.isPending}
                        isEdit={true}
                        currency={currency}
                        language={language}
                        t={t}
                    />
                </Dialog>

                {/* Payment Dialog */}
                <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{t('debts.add_payment_title')}</DialogTitle>
                            <DialogDescription>
                                {t('debts.add_payment_desc', { name: payingDebt?.person_name })}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4 py-2">
                            <div className="p-6 rounded-3xl bg-background shadow-neu-inset-deep flex flex-col items-center justify-center">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                    {t('debts.payment_amount')}
                                </Label>
                                <div className="flex items-baseline justify-center w-full">
                                    <span className="text-2xl sm:text-3xl font-extrabold text-muted-foreground mr-2">
                                        {currency === 'USD' ? '$' : 'Rp'}
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className="text-3xl sm:text-5xl font-extrabold font-mono bg-transparent border-none text-center w-full focus:ring-0 placeholder:text-muted-foreground/30 p-0 outline-none text-foreground"
                                        placeholder="0"
                                        value={paymentFormData.amount ? Math.floor(Number(paymentFormData.amount)).toLocaleString(language) : ''}
                                        onKeyDown={(e) => {
                                            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                            const numValue = parseInt(rawValue) || 0;
                                            setPaymentFormData({ ...paymentFormData, amount: numValue });
                                        }}
                                        required
                                        autoFocus
                                    />
                                </div>
                                {payingDebt && (
                                    <p className="text-xs text-muted-foreground mt-3 font-semibold">
                                        {t('debts.max_payment')}: <CurrencyDisplay value={payingDebt.remaining_amount} />
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> {t('debts.payment_date')}
                                </Label>
                                <Input
                                    type="date"
                                    value={paymentFormData.payment_date}
                                    onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <AlignLeft className="w-3.5 h-3.5 text-primary" /> {t('debts.notes')}
                                </Label>
                                <Input
                                    value={paymentFormData.notes || ''}
                                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                                    placeholder={t('debts.notes_placeholder')}
                                />
                            </div>

                            <Button type="submit" className="w-full mt-6 h-12 font-bold" disabled={addPaymentMutation.isPending}>
                                {addPaymentMutation.isPending ? t('debts.saving') : t('debts.save_payment')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('debts.delete_confirm_title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('debts.delete_confirm_desc')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                                {deleteMutation.isPending ? t('debts.deleting') : t('debts.delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}

function DebtFormDialog({
    formData,
    setFormData,
    onSubmit,
    isSubmitting,
    isEdit,
    currency,
    language,
    t
}: {
    formData: Partial<Debt>;
    setFormData: (data: Partial<Debt>) => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
    isEdit: boolean;
    currency: string;
    language: string;
    t: (key: string, options?: any) => string;
}) {
    return (
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>{isEdit ? t('debts.edit_debt') : t('debts.add_debt')}</DialogTitle>
                <DialogDescription>{isEdit ? t('debts.edit_debt_desc') : t('debts.add_debt_desc')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4 py-2">
                <div className="p-6 rounded-3xl bg-background shadow-neu-inset-deep flex flex-col items-center justify-center">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                        {t('debts.amount')}
                    </Label>
                    <div className="flex items-baseline justify-center w-full">
                        <span className="text-2xl sm:text-3xl font-extrabold text-muted-foreground mr-2">
                            {currency === 'USD' ? '$' : 'Rp'}
                        </span>
                        <input
                            type="text"
                            inputMode="numeric"
                            className="text-3xl sm:text-5xl font-extrabold font-mono bg-transparent border-none text-center w-full focus:ring-0 placeholder:text-muted-foreground/30 p-0 outline-none text-foreground"
                            placeholder="0"
                            value={formData.amount ? Math.floor(Number(formData.amount)).toLocaleString(language) : ''}
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
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-primary" /> {t('debts.type')}
                        </Label>
                        <div className="relative">
                            <select
                                className="appearance-none flex h-11 w-full rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-4 text-sm text-foreground font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                required
                            >
                                <option value="payable">💸 {t('debts.type_payable')}</option>
                                <option value="receivable">💰 {t('debts.type_receivable')}</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-primary" /> {t('debts.person_name')}
                        </Label>
                        <Input
                            value={formData.person_name || ''}
                            onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                            placeholder={t('debts.person_name_placeholder')}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary" /> {t('debts.due_date')}
                        </Label>
                        <Input
                            type="date"
                            value={formData.due_date || ''}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value || undefined })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <AlignLeft className="w-3.5 h-3.5 text-primary" /> {t('debts.notes')}
                        </Label>
                        <Input
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t('debts.notes_placeholder')}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full mt-6 h-12 font-bold" disabled={isSubmitting}>
                    {isSubmitting ? t('debts.saving') : isEdit ? t('debts.update_btn') : t('debts.save_btn')}
                </Button>
            </form>
        </DialogContent>
    );
}
