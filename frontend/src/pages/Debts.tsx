import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type Debt, type DebtPayment } from '@/services/financial';
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
import { Plus, Trash2, Pencil, ChevronDown, User, Calendar, AlignLeft, ArrowDownLeft, ArrowUpRight, Check, CreditCard, Clock, Search, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { useTranslation } from 'react-i18next';
import { usePreferencesStore } from '@/hooks/usePreferences';
import { SwipeableItem } from '@/components/SwipeableItem';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Tab Types
type TabType = 'all' | 'payable' | 'receivable';
type StatusFilter = 'all' | 'active' | 'paid';

// Haptic feedback helper
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
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Debt>>({
        type: 'payable',
        person_name: '',
        description: '',
        amount: 0,
        due_date: '',
    });

    const [paymentFormData, setPaymentFormData] = useState<Partial<DebtPayment>>({
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    // Queries
    const { data: debts, isLoading } = useQuery({
        queryKey: ['debts'],
        queryFn: () => financialService.getDebts()
    });

    // Computed Data
    const filteredDebts = useMemo(() => {
        if (!debts) return [];

        return debts.filter(debt => {
            // Tab filter
            if (activeTab !== 'all' && debt.type !== activeTab) return false;

            // Status filter
            if (statusFilter === 'active' && debt.is_paid) return false;
            if (statusFilter === 'paid' && !debt.is_paid) return false;

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return debt.person_name.toLowerCase().includes(query) ||
                    debt.description?.toLowerCase().includes(query);
            }

            return true;
        });
    }, [debts, activeTab, statusFilter, searchQuery]);

    // Stats
    const stats = useMemo(() => {
        if (!debts) return { totalPayable: 0, totalReceivable: 0, unpaidPayable: 0, unpaidReceivable: 0 };

        const totalPayable = debts.filter(d => d.type === 'payable').reduce((sum, d) => sum + d.amount, 0);
        const totalReceivable = debts.filter(d => d.type === 'receivable').reduce((sum, d) => sum + d.amount, 0);
        const unpaidPayable = debts.filter(d => d.type === 'payable' && !d.is_paid).reduce((sum, d) => sum + d.remaining_amount, 0);
        const unpaidReceivable = debts.filter(d => d.type === 'receivable' && !d.is_paid).reduce((sum, d) => sum + d.remaining_amount, 0);

        return { totalPayable, totalReceivable, unpaidPayable, unpaidReceivable };
    }, [debts]);

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
        mutationFn: (data: { id: number; debt: Partial<Debt> }) => financialService.updateDebt(data.id, data.debt),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            setIsEditOpen(false);
            setEditingDebt(null);
            resetForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: financialService.deleteDebt,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
        }
    });

    const togglePaidMutation = useMutation({
        mutationFn: financialService.toggleDebtPaid,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            vibrate([50, 30, 50]);
        }
    });

    const addPaymentMutation = useMutation({
        mutationFn: (data: { debtId: number; payment: Partial<DebtPayment> }) =>
            financialService.addDebtPayment(data.debtId, data.payment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            setIsPaymentOpen(false);
            setPayingDebt(null);
            resetPaymentForm();
            vibrate([50, 30, 50]);
        }
    });

    // Reset Functions
    const resetForm = () => {
        setFormData({
            type: 'payable',
            person_name: '',
            description: '',
            amount: 0,
            due_date: '',
        });
    };

    const resetPaymentForm = () => {
        setPaymentFormData({
            amount: 0,
            payment_date: new Date().toISOString().split('T')[0],
            notes: '',
        });
    };

    // Handlers
    const handleEdit = (debt: Debt) => {
        setEditingDebt(debt);
        setFormData({
            type: debt.type,
            person_name: debt.person_name,
            description: debt.description,
            amount: debt.amount,
            due_date: debt.due_date || '',
        });
        setIsEditOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteTarget(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            deleteMutation.mutate(deleteTarget);
        }
        setDeleteConfirmOpen(false);
        setDeleteTarget(null);
    };

    const handleAddPayment = (debt: Debt) => {
        setPayingDebt(debt);
        setPaymentFormData({
            amount: debt.remaining_amount,
            payment_date: new Date().toISOString().split('T')[0],
            notes: '',
        });
        setIsPaymentOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDebt) {
            updateMutation.mutate({ id: editingDebt.id, debt: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (payingDebt) {
            addPaymentMutation.mutate({ debtId: payingDebt.id, payment: paymentFormData });
        }
    };

    const formatDueDate = (dateStr?: string) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const today = new Date();
        const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: t('debts.overdue'), variant: 'destructive' as const };
        if (diffDays === 0) return { text: t('debts.due_today'), variant: 'warning' as const };
        if (diffDays <= 7) return { text: t('debts.due_soon', { days: diffDays }), variant: 'warning' as const };
        return { text: date.toLocaleDateString(language), variant: 'default' as const };
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-20 md:pb-8">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-display font-bold">{t('debts.title')}</h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t('debts.description')}</p>
                    </div>
                    {isDesktop && (
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={resetForm} className="shadow-lg shadow-primary/20 rounded-xl">
                                    <Plus className="mr-2 h-4 w-4" /> {t('debts.add_debt')}
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
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* Hutang (Payable) */}
                    <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl glass-card hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-rose-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2 sm:mb-4">
                                <div className="p-1.5 sm:p-2.5 bg-rose-500/15 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                                    <ArrowDownLeft className="h-4 w-4 sm:h-6 sm:w-6 text-rose-500" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full border border-rose-500/20">
                                    {t('debts.payable')}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-2xl lg:text-3xl font-bold font-display text-foreground animate-value truncate">
                                    <CurrencyDisplay value={stats.unpaidPayable} />
                                </h3>
                                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1.5">{t('debts.total_owed')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Piutang (Receivable) */}
                    <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl glass-card hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2 sm:mb-4">
                                <div className="p-1.5 sm:p-2.5 bg-emerald-500/15 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                                    <ArrowUpRight className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-500" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full border border-emerald-500/20">
                                    {t('debts.receivable')}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-2xl lg:text-3xl font-bold font-display text-foreground animate-value truncate">
                                    <CurrencyDisplay value={stats.unpaidReceivable} />
                                </h3>
                                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1.5">{t('debts.total_receivable')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-secondary/50 p-1 rounded-xl w-full sm:w-auto sm:self-start">
                    {(['all', 'payable', 'receivable'] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab
                                    ? "bg-white dark:bg-slate-800 shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab === 'all' && t('debts.tab_all')}
                            {tab === 'payable' && t('debts.tab_payable')}
                            {tab === 'receivable' && t('debts.tab_receivable')}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-9 h-11 bg-card border-none shadow-sm rounded-xl focus-visible:ring-1 transition-all"
                            placeholder={t('debts.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <select
                            className="w-full sm:w-40 appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:border-primary/50 cursor-pointer shadow-sm font-medium"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        >
                            <option value="all">{t('debts.filter_all')}</option>
                            <option value="active">{t('debts.filter_active')}</option>
                            <option value="paid">{t('debts.filter_paid')}</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>
                </div>

                {/* Debt List */}
                <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries({ queryKey: ['debts'] }); }}>
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">{t('debts.loading')}</div>
                        ) : filteredDebts.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-border rounded-xl">
                                <div className="flex flex-col items-center gap-2">
                                    <CreditCard className="h-10 w-10 text-muted-foreground/50" />
                                    <h3 className="text-lg font-semibold">{t('debts.no_debts')}</h3>
                                    <p className="text-muted-foreground text-sm">{t('debts.no_debts_desc')}</p>
                                    <Button variant="outline" className="mt-4" onClick={() => { resetForm(); setIsAddOpen(true); }}>
                                        {t('debts.add_first_debt')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            filteredDebts.map((debt) => {
                                const percentage = debt.amount > 0 ? Math.round(((debt.amount - debt.remaining_amount) / debt.amount) * 100) : 0;
                                const dueInfo = formatDueDate(debt.due_date);
                                const isPayable = debt.type === 'payable';

                                return (
                                    <SwipeableItem
                                        key={debt.id}
                                        onSwipeLeft={() => handleDelete(debt.id)}
                                        onSwipeRight={() => handleEdit(debt)}
                                        vibrate={() => vibrate(10)}
                                        leftContent={<Trash2 className="w-5 h-5 text-white" />}
                                        rightContent={<Pencil className="w-5 h-5 text-white" />}
                                        className={cn(
                                            "group relative p-4 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all duration-300",
                                            debt.is_paid && "opacity-60"
                                        )}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className={cn(
                                                "p-2.5 rounded-xl shrink-0",
                                                isPayable ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-500"
                                            )}>
                                                {isPayable ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-base truncate flex items-center gap-2">
                                                            {debt.person_name}
                                                            {debt.is_paid && (
                                                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                                                                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> {t('debts.paid')}
                                                                </span>
                                                            )}
                                                        </h3>
                                                        {debt.description && (
                                                            <p className="text-xs text-muted-foreground truncate">{debt.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className={cn("font-bold text-base", isPayable ? "text-rose-500" : "text-emerald-500")}>
                                                            <CurrencyDisplay value={debt.amount} />
                                                        </p>
                                                        {!debt.is_paid && debt.remaining_amount !== debt.amount && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {t('debts.remaining')}: <CurrencyDisplay value={debt.remaining_amount} />
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                {!debt.is_paid && (
                                                    <div className="space-y-1.5">
                                                        <Progress
                                                            value={percentage}
                                                            className={cn(
                                                                "h-2 rounded-full bg-slate-100 dark:bg-slate-800",
                                                                isPayable ? "[&>div]:bg-rose-500" : "[&>div]:bg-emerald-500"
                                                            )}
                                                        />
                                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                                            <span>{percentage}% {t('debts.paid_progress')}</span>
                                                            {dueInfo && (
                                                                <span className={cn(
                                                                    "flex items-center gap-1",
                                                                    dueInfo.variant === 'destructive' && "text-rose-500",
                                                                    dueInfo.variant === 'warning' && "text-amber-500"
                                                                )}>
                                                                    <Clock className="w-2.5 h-2.5" />
                                                                    {dueInfo.text}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!debt.is_paid && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 rounded-lg text-xs"
                                                            onClick={() => handleAddPayment(debt)}
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" /> {t('debts.add_payment')}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant={debt.is_paid ? "outline" : "default"}
                                                        size="sm"
                                                        className={cn("h-8 rounded-lg text-xs", !debt.is_paid && "bg-emerald-500 hover:bg-emerald-600")}
                                                        onClick={() => togglePaidMutation.mutate(debt.id)}
                                                    >
                                                        <Check className="w-3 h-3 mr-1" />
                                                        {debt.is_paid ? t('debts.mark_unpaid') : t('debts.mark_paid')}
                                                    </Button>
                                                </div>
                                            </div>
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

                {/* Add Dialog for Mobile */}
                {!isDesktop && (
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
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
                )}

                {/* Payment Dialog */}
                <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                    <DialogContent className={cn(
                        "flex flex-col gap-0 p-0 overflow-hidden",
                        "w-full sm:w-auto h-full sm:h-auto",
                        "sm:max-w-[425px] sm:rounded-2xl",
                        "border-0 sm:border"
                    )}>
                        <DialogHeader className="px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-border/50 shrink-0">
                            <DialogTitle>{t('debts.add_payment_title')}</DialogTitle>
                            <DialogDescription>
                                {t('debts.add_payment_desc', { name: payingDebt?.person_name })}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePaymentSubmit} className="flex flex-col h-full bg-background">
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                                {/* Amount */}
                                <div className="relative py-4 sm:py-6 bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                                        {t('debts.payment_amount')}
                                    </Label>
                                    <div className="flex items-baseline justify-center relative w-full px-4 sm:px-8">
                                        <span className="text-xl sm:text-2xl font-bold text-muted-foreground mr-1">
                                            {currency === 'USD' ? '$' : 'Rp'}
                                        </span>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            className="text-3xl sm:text-4xl font-bold bg-transparent border-none text-center w-full focus-visible:ring-0 placeholder:text-muted-foreground/20 p-0 shadow-none h-auto"
                                            placeholder="0"
                                            value={paymentFormData.amount ? Math.floor(Number(paymentFormData.amount)).toLocaleString(language) : ''}
                                            onKeyDown={(e) => {
                                                if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onChange={(e) => {
                                                const rawValue = e.target.value.replace(/\./g, '').replace(/,/g, '');
                                                const numValue = parseInt(rawValue) || 0;
                                                setPaymentFormData({ ...paymentFormData, amount: numValue });
                                            }}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    {payingDebt && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {t('debts.max_payment')}: <CurrencyDisplay value={payingDebt.remaining_amount} />
                                        </p>
                                    )}
                                </div>

                                {/* Date */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="w-4 h-4 text-primary" /> {t('debts.payment_date')}
                                    </Label>
                                    <Input
                                        type="date"
                                        className="h-12 rounded-xl border-input bg-background/50 text-base font-medium cursor-pointer shadow-sm"
                                        value={paymentFormData.payment_date}
                                        onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                        <AlignLeft className="w-4 h-4 text-primary" /> {t('debts.notes')}
                                    </Label>
                                    <Input
                                        className="h-12 rounded-xl border-input bg-background/50 text-base shadow-sm"
                                        value={paymentFormData.notes || ''}
                                        onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                                        placeholder={t('debts.notes_placeholder')}
                                    />
                                </div>
                            </div>

                            <div className="shrink-0 p-6 bg-background border-t border-border/50">
                                <Button type="submit" size="lg" className="w-full rounded-xl shadow-lg" disabled={addPaymentMutation.isPending}>
                                    {addPaymentMutation.isPending ? t('debts.saving') : t('debts.save_payment')}
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
                                {t('debts.delete_confirm_title')}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-base">
                                {t('debts.delete_confirm_desc')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2 sm:gap-0">
                            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                            >
                                {deleteMutation.isPending ? t('debts.deleting') : t('debts.delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}

// Debt Form Dialog Component
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
        <DialogContent className={cn(
            "flex flex-col gap-0 p-0 overflow-hidden",
            "w-full sm:w-auto h-full sm:h-auto",
            "sm:max-w-[500px] sm:rounded-2xl",
            "border-0 sm:border"
        )}>
            <DialogHeader className="px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-border/50 shrink-0">
                <DialogTitle>{isEdit ? t('debts.edit_debt') : t('debts.add_debt')}</DialogTitle>
                <DialogDescription>{isEdit ? t('debts.edit_debt_desc') : t('debts.add_debt_desc')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="flex flex-col h-full bg-background">
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                    {/* Amount */}
                    <div className="relative py-4 sm:py-6 bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                            {t('debts.amount')}
                        </Label>
                        <div className="flex items-baseline justify-center relative w-full px-4 sm:px-8">
                            <span className="text-xl sm:text-2xl font-bold text-muted-foreground mr-1">
                                {currency === 'USD' ? '$' : 'Rp'}
                            </span>
                            <Input
                                type="text"
                                inputMode="numeric"
                                className="text-3xl sm:text-4xl font-bold bg-transparent border-none text-center w-full focus-visible:ring-0 placeholder:text-muted-foreground/20 p-0 shadow-none h-auto"
                                placeholder="0"
                                value={formData.amount ? Math.floor(Number(formData.amount)).toLocaleString(language) : ''}
                                onKeyDown={(e) => {
                                    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\./g, '').replace(/,/g, '');
                                    const numValue = parseInt(rawValue) || 0;
                                    setFormData({ ...formData, amount: numValue });
                                }}
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Type */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                <CreditCard className="w-4 h-4 text-primary" /> {t('debts.type')}
                            </Label>
                            <div className="relative">
                                <select
                                    className="appearance-none flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background/50 px-4 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'payable' | 'receivable' })}
                                    required
                                >
                                    <option value="payable">{t('debts.type_payable')}</option>
                                    <option value="receivable">{t('debts.type_receivable')}</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Person Name */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                <User className="w-4 h-4 text-primary" /> {t('debts.person_name')}
                            </Label>
                            <Input
                                className="h-12 rounded-xl border-input bg-background/50 text-base shadow-sm"
                                value={formData.person_name}
                                onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                                placeholder={t('debts.person_name_placeholder')}
                                required
                            />
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4 text-primary" /> {t('debts.due_date')}
                        </Label>
                        <Input
                            type="date"
                            className="h-12 rounded-xl border-input bg-background/50 text-base font-medium cursor-pointer shadow-sm"
                            value={formData.due_date || ''}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <AlignLeft className="w-4 h-4 text-primary" /> {t('debts.description')}
                        </Label>
                        <Input
                            className="h-12 rounded-xl border-input bg-background/50 text-base shadow-sm"
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t('debts.description_placeholder')}
                        />
                    </div>
                </div>

                <div className="shrink-0 p-6 bg-background border-t border-border/50">
                    <Button type="submit" size="lg" className="w-full rounded-xl shadow-lg" disabled={isSubmitting}>
                        {isSubmitting ? t('debts.saving') : (isEdit ? t('debts.update_debt') : t('debts.save_debt'))}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}
