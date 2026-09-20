import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type Transaction, type Category, type Account } from '@/services/financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePreferencesStore } from '@/hooks/usePreferences';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    Wallet,
    Calendar as CalendarIcon,
    AlignLeft,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

const vibrate = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

export default function AddTransactionPage() {
    const { t } = useTranslation();
    const { currency, language } = usePreferencesStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [txType, setTxType] = useState<'expense' | 'income'>('expense');
    const [formData, setFormData] = useState<Partial<Transaction>>({
        name: '',
        amount: 0,
        transaction_date: new Date().toISOString().split('T')[0],
        category_id: 0,
        account_id: 0,
    });

    // Queries
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: financialService.getCategories
    });

    const { data: accounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: financialService.getAccounts
    });

    // Default account setup
    useEffect(() => {
        if (accounts && accounts.length > 0 && formData.account_id === 0) {
            const defaultAcc = accounts.find((a: Account) => a.is_default) || accounts[0];
            setFormData(prev => ({ ...prev, account_id: defaultAcc.id }));
        }
    }, [accounts]);

    // Default category setup when type changes
    useEffect(() => {
        if (categories && categories.length > 0) {
            const firstOfThisType = categories.find((c: Category) => c.type === txType);
            if (firstOfThisType) {
                setFormData(prev => ({ ...prev, category_id: firstOfThisType.id }));
            }
        }
    }, [categories, txType]);

    // Mutation
    const createMutation = useMutation({
        mutationFn: financialService.createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            vibrate([50, 30, 50]);
            navigate('/transactions');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((formData.amount || 0) <= 0) return;
        createMutation.mutate(formData);
    };

    return (
        <DashboardLayout hideBottomNav>
            <div className="flex flex-col gap-4 w-full max-w-xl mx-auto pb-8 md:pb-10 px-1 sm:px-0">
                {/* Back Button & Title */}
                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="h-10 w-10 rounded-2xl bg-background shadow-neu-extruded-sm hover:shadow-neu-extruded-hover active:shadow-neu-inset-sm flex items-center justify-center text-foreground transition-all duration-200 shrink-0"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <h1 className="text-lg sm:text-xl font-display font-extrabold text-foreground tracking-tight text-center">
                        {t('transactions.new_transaction')}
                    </h1>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                {/* Type Switcher (Expense / Income) */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset">
                    <button
                        type="button"
                        onClick={() => {
                            setTxType('expense');
                            vibrate(10);
                        }}
                        className={cn(
                            "py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-300 select-none",
                            txType === 'expense'
                                ? "bg-background shadow-neu-extruded text-rose-500 font-black"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <ArrowDownRight className="h-4 w-4" />
                        {t('dashboard.expense')}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setTxType('income');
                            vibrate(10);
                        }}
                        className={cn(
                            "py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-300 select-none",
                            txType === 'income'
                                ? "bg-background shadow-neu-extruded text-neu-accent-sec font-black"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <ArrowUpRight className="h-4 w-4" />
                        {t('dashboard.income')}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Amount Sunken Display (Compact & Clean) */}
                    <div className="py-4 px-5 rounded-2xl bg-background shadow-neu-inset-deep flex flex-col items-center justify-center">
                        <Label htmlFor="amount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            {t('transactions.total_amount')}
                        </Label>
                        <div className="flex items-baseline justify-center w-full">
                            <span className="text-xl sm:text-2xl font-extrabold text-muted-foreground mr-1.5 font-mono">
                                {currency === 'USD' ? '$' : 'Rp'}
                            </span>
                            <input
                                id="amount"
                                type="text"
                                inputMode="numeric"
                                className={cn(
                                    "text-3xl sm:text-4xl font-black font-mono bg-transparent border-none text-center w-full focus:ring-0 placeholder:text-muted-foreground/30 p-0 outline-none",
                                    txType === 'expense' ? "text-rose-500" : "text-neu-accent-sec"
                                )}
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

                    {/* Category Selection (Horizontal Scrollable Chips to avoid vertical clutter) */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                {t('transactions.category')}
                            </Label>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                                {categories?.filter((c: Category) => c.type === txType).length || 0} Kategori
                            </span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 px-0.5 custom-scrollbar -mx-1 px-1">
                            {categories?.filter((c: Category) => c.type === txType).map((cat: Category) => {
                                const isSelected = formData.category_id === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, category_id: cat.id });
                                            vibrate(10);
                                        }}
                                        className={cn(
                                            "h-8 px-3 rounded-xl text-xs font-bold transition-all duration-200 select-none flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                                            isSelected
                                                ? "bg-background shadow-neu-inset text-primary font-black"
                                                : "bg-background shadow-neu-extruded-sm text-foreground hover:text-primary active:shadow-neu-inset-sm"
                                        )}
                                    >
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            isSelected ? "bg-primary" : cat.type === 'income' ? "bg-neu-accent-sec" : "bg-rose-500"
                                        )} />
                                        <span>{cat.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Account & Date in Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Account */}
                        <div className="space-y-1.5">
                            <Label htmlFor="account" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
                                <Wallet className="w-3.5 h-3.5 text-primary" /> {t('transactions.account')}
                            </Label>
                            <div className="relative">
                                <select
                                    id="account"
                                    className="appearance-none flex h-11 w-full rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-3 text-xs sm:text-sm text-foreground font-bold cursor-pointer outline-none focus:ring-2 focus:ring-primary truncate pr-9"
                                    value={formData.account_id}
                                    onChange={(e) => setFormData({ ...formData, account_id: Number(e.target.value) })}
                                    required
                                >
                                    {accounts?.map((acc: Account) => (
                                        <option key={acc.id} value={acc.id} className="bg-background text-foreground font-medium">
                                            {acc.name} ({new Intl.NumberFormat(language || 'id-ID', { style: 'currency', currency: 'IDR' }).format(acc.balance)})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="space-y-1.5">
                            <Label htmlFor="date" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
                                <CalendarIcon className="w-3.5 h-3.5 text-primary" /> {t('transactions.date')}
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                className="h-11 text-xs sm:text-sm font-bold"
                                value={formData.transaction_date}
                                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Note / Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
                            <AlignLeft className="w-3.5 h-3.5 text-primary" /> {t('transactions.note')}
                        </Label>
                        <Input
                            id="name"
                            className="h-11 text-xs sm:text-sm font-medium"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('transactions.note_placeholder')}
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={createMutation.isPending || (formData.amount || 0) <= 0}
                        className="w-full h-12 text-sm sm:text-base font-extrabold rounded-2xl mt-2 gap-2"
                    >
                        {createMutation.isPending ? t('transactions.saving') : (
                            <>
                                <Check className="h-4 w-4 stroke-[3]" />
                                {t('transactions.save')}
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </DashboardLayout>
    );
}
