import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type Budget, type BudgetPeriodType } from '@/services/financial';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Plus,
    Trash2,
    Pencil,
    Wallet,
    ChevronDown,
    Tag,
    Sparkles,
    Target,
    ArrowDownRight,
    AlertCircle,
    ShieldCheck,
    Infinity as InfinityIcon,
    Calendar,
    CalendarRange,
    CalendarDays,
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { useTranslation } from 'react-i18next';
import { usePreferencesStore } from '@/hooks/usePreferences';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { isBudgetActive, getBudgetMonthProgress } from '@/lib/budgetUtils';

interface BudgetStatItem extends Budget {
    categoryName: string;
    spent: number;
    percentage: number;
    monthProgress: { current: number; total: number } | null;
}

export default function BudgetPage() {
    const { t } = useTranslation();
    const { currency, language } = usePreferencesStore();
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const queryClient = useQueryClient();

    // Dialog State
    const [isBudgetAddOpen, setIsBudgetAddOpen] = useState(false);
    const [isBudgetEditOpen, setIsBudgetEditOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

    // Filter State
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

    // Form Duration Range helper state (for custom_range)
    const [durationMonths, setDurationMonths] = useState<number>(3);

    // Form States
    const [budgetFormData, setBudgetFormData] = useState<Partial<Budget>>({
        category_id: 0,
        budget_amount: 0,
        period_type: 'monthly',
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        start_month: currentDate.getMonth() + 1,
        start_year: currentDate.getFullYear(),
        end_month: currentDate.getMonth() + 1,
        end_year: currentDate.getFullYear(),
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

    // Computed Data - Budgets active in selectedMonth & selectedYear
    const filteredBudgets = useMemo(() => {
        if (!budgets) return [];
        return budgets.filter(b => isBudgetActive(b, selectedMonth, selectedYear));
    }, [budgets, selectedMonth, selectedYear]);

    const budgetStats = useMemo<BudgetStatItem[]>(() => {
        if (!filteredBudgets || !transactions) return [];

        return filteredBudgets.map(budget => {
            const spent = transactions
                .filter(tx => {
                    const txDate = new Date(tx.transaction_date);
                    return tx.category_id === budget.category_id &&
                        txDate.getMonth() + 1 === selectedMonth &&
                        txDate.getFullYear() === selectedYear;
                })
                .reduce((sum, tx) => sum + Number(tx.amount), 0);

            const category = categories?.find(c => c.id === budget.category_id);
            const percentage = budget.budget_amount > 0 ? Math.min(Math.round((spent / Number(budget.budget_amount)) * 100), 999) : 0;
            const monthProgress = getBudgetMonthProgress(budget, selectedMonth, selectedYear);

            return {
                ...budget,
                categoryName: category?.name || 'Unknown',
                spent,
                percentage,
                monthProgress,
            };
        });
    }, [filteredBudgets, transactions, categories, selectedMonth, selectedYear]);

    const totalBudget = useMemo(() => {
        return budgetStats.reduce((acc, curr) => acc + Number(curr.budget_amount), 0);
    }, [budgetStats]);

    const totalSpent = useMemo(() => {
        return budgetStats.reduce((acc, curr) => acc + curr.spent, 0);
    }, [budgetStats]);

    const totalRemaining = totalBudget - totalSpent;

    // Helper to calculate end_month and end_year based on start and duration
    const calculateEndDate = (startM: number, startY: number, monthsCount: number) => {
        const startIdx = startY * 12 + (startM - 1);
        const endIdx = startIdx + monthsCount - 1;
        const endY = Math.floor(endIdx / 12);
        const endM = (endIdx % 12) + 1;
        return { endM, endY };
    };

    const getMonthName = (m: number) => {
        return new Date(2026, m - 1, 1).toLocaleString(language || 'en-US', { month: 'short' });
    };

    const getFullMonthName = (m: number) => {
        return new Date(2026, m - 1, 1).toLocaleString(language || 'en-US', { month: 'long' });
    };

    // Helper to update start date and sync end date if in custom_range mode
    const handleStartPeriodChange = (newM: number, newY: number) => {
        const currentPeriodType = budgetFormData.period_type || 'monthly';
        if (currentPeriodType === 'custom_range') {
            const { endM, endY } = calculateEndDate(newM, newY, durationMonths);
            setBudgetFormData(prev => ({
                ...prev,
                month: newM,
                year: newY,
                start_month: newM,
                start_year: newY,
                end_month: endM,
                end_year: endY
            }));
        } else if (currentPeriodType === 'yearly') {
            setBudgetFormData(prev => ({
                ...prev,
                month: 1,
                year: newY,
                start_month: 1,
                start_year: newY,
                end_month: 12,
                end_year: newY
            }));
        } else if (currentPeriodType === 'forever') {
            setBudgetFormData(prev => ({
                ...prev,
                month: newM,
                year: newY,
                start_month: newM,
                start_year: newY,
                end_month: null,
                end_year: null
            }));
        } else {
            setBudgetFormData(prev => ({
                ...prev,
                month: newM,
                year: newY,
                start_month: newM,
                start_year: newY,
                end_month: newM,
                end_year: newY
            }));
        }
    };

    // Helper when period type changes
    const handlePeriodTypeChange = (type: BudgetPeriodType) => {
        const startM = budgetFormData.start_month || selectedMonth;
        const startY = budgetFormData.start_year || selectedYear;

        if (type === 'custom_range') {
            const { endM, endY } = calculateEndDate(startM, startY, durationMonths);
            setBudgetFormData(prev => ({
                ...prev,
                period_type: type,
                start_month: startM,
                start_year: startY,
                end_month: endM,
                end_year: endY
            }));
        } else if (type === 'yearly') {
            setBudgetFormData(prev => ({
                ...prev,
                period_type: type,
                start_month: 1,
                start_year: startY,
                end_month: 12,
                end_year: startY
            }));
        } else if (type === 'forever') {
            setBudgetFormData(prev => ({
                ...prev,
                period_type: type,
                start_month: startM,
                start_year: startY,
                end_month: null,
                end_year: null
            }));
        } else {
            // monthly
            setBudgetFormData(prev => ({
                ...prev,
                period_type: type,
                start_month: startM,
                start_year: startY,
                end_month: startM,
                end_year: startY
            }));
        }
    };

    // Helper for changing duration months count (for range)
    const handleDurationMonthsChange = (months: number) => {
        const validMonths = Math.max(1, Math.min(36, months));
        setDurationMonths(validMonths);
        const startM = budgetFormData.start_month || selectedMonth;
        const startY = budgetFormData.start_year || selectedYear;
        const { endM, endY } = calculateEndDate(startM, startY, validMonths);
        setBudgetFormData(prev => ({
            ...prev,
            end_month: endM,
            end_year: endY
        }));
    };

    // Mutations
    const createBudgetMutation = useMutation({
        mutationFn: financialService.createBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
            setIsBudgetAddOpen(false);
            resetBudgetForm();
        }
    });

    const updateBudgetMutation = useMutation({
        mutationFn: (data: { id: number; budget: Partial<Budget> }) =>
            financialService.updateBudget(data.id, data.budget),
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

    const resetBudgetForm = () => {
        setDurationMonths(3);
        setBudgetFormData({
            category_id: 0,
            budget_amount: 0,
            period_type: 'monthly',
            month: selectedMonth,
            year: selectedYear,
            start_month: selectedMonth,
            start_year: selectedYear,
            end_month: selectedMonth,
            end_year: selectedYear,
        });
    };

    const handleBudgetEdit = (budget: Budget) => {
        setEditingBudget(budget);
        const pType = budget.period_type || 'monthly';
        const startM = budget.start_month ?? budget.month;
        const startY = budget.start_year ?? budget.year;
        const endM = budget.end_month ?? startM;
        const endY = budget.end_year ?? startY;

        let diffMonths = 1;
        if (pType === 'custom_range' && endM && endY) {
            diffMonths = (endY * 12 + endM) - (startY * 12 + startM) + 1;
        }
        setDurationMonths(Math.max(1, diffMonths));

        setBudgetFormData({
            category_id: budget.category_id,
            budget_amount: Number(budget.budget_amount),
            period_type: pType,
            month: startM,
            year: startY,
            start_month: startM,
            start_year: startY,
            end_month: budget.end_month,
            end_year: budget.end_year,
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
            <div className="flex flex-col gap-6 sm:gap-8 w-full pb-20 md:pb-8 px-1 sm:px-0">
                {/* Mobile FAB */}
                {!isDesktop && (
                    <button
                        className="fixed bottom-24 right-6 h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-neu-extruded z-40 flex items-center justify-center active:translate-y-0.5 active:shadow-neu-inset-sm transition-all"
                        onClick={() => {
                            resetBudgetForm();
                            setIsBudgetAddOpen(true);
                        }}
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                )}

                {/* Month Filters & Action */}
                <div className="flex justify-end items-center gap-2.5">
                    <div className="relative">
                        <select
                            className="appearance-none bg-background shadow-neu-inset dark:shadow-neu-dark-inset rounded-2xl pl-4 pr-9 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-bold"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m} className="bg-background text-foreground py-2 font-medium">
                                    {getFullMonthName(m)}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            className="appearance-none bg-background shadow-neu-inset dark:shadow-neu-dark-inset rounded-2xl pl-4 pr-9 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-bold"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(y => (
                                <option key={y} value={y} className="bg-background text-foreground py-2 font-medium">{y}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* Desktop Button */}
                    {isDesktop && (
                        <Button onClick={() => { resetBudgetForm(); setIsBudgetAddOpen(true); }} className="font-semibold gap-2">
                            <Plus className="h-4 w-4" /> {t('budget.set_budget')}
                        </Button>
                    )}

                    {/* Add Budget Dialog */}
                    <Dialog open={isBudgetAddOpen} onOpenChange={setIsBudgetAddOpen}>
                        <DialogContent className="sm:max-w-[480px]">
                            <DialogHeader>
                                <DialogTitle>{t('budget.set_budget_title')}</DialogTitle>
                                <DialogDescription>{t('budget.set_budget_desc')}</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleBudgetSubmit} className="space-y-4 py-2">
                                {/* Amount Input */}
                                <div className="p-5 rounded-3xl bg-background shadow-neu-inset-deep flex flex-col items-center justify-center">
                                    <Label htmlFor="amount" className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{t('budget.limit_amount')}</Label>
                                    <div className="flex items-baseline justify-center w-full">
                                        <span className="text-2xl sm:text-3xl font-extrabold text-muted-foreground mr-2">{currency === 'USD' ? '$' : 'Rp'}</span>
                                        <input
                                            id="amount"
                                            type="text"
                                            inputMode="numeric"
                                            className="text-3xl sm:text-5xl font-extrabold font-mono bg-transparent border-none text-center w-full focus:ring-0 placeholder:text-muted-foreground/30 p-0 outline-none text-foreground"
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

                                {/* Category Selector */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="category" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-primary" /> {t('budget.category_label')}
                                    </Label>
                                    <div className="relative">
                                        <select
                                            id="category"
                                            className="appearance-none flex h-11 w-full rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-4 text-sm text-foreground font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary"
                                            value={budgetFormData.category_id}
                                            onChange={(e) => setBudgetFormData({ ...budgetFormData, category_id: Number(e.target.value) })}
                                            required
                                        >
                                            <option value={0} disabled>{t('budget.select_category')}</option>
                                            {categories?.filter(c => c.type === 'expense').map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                {/* Duration / Period Type Tabs */}
                                <div className="space-y-2 pt-1">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-primary" /> {t('budget.period_type')}
                                    </Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { type: 'monthly', label: t('budget.period_monthly'), icon: CalendarDays },
                                            { type: 'custom_range', label: t('budget.period_custom_range'), icon: CalendarRange },
                                            { type: 'yearly', label: t('budget.period_yearly'), icon: Calendar },
                                            { type: 'forever', label: t('budget.period_forever'), icon: InfinityIcon },
                                        ].map(item => {
                                            const IconComponent = item.icon;
                                            const isSelected = (budgetFormData.period_type || 'monthly') === item.type;
                                            return (
                                                <button
                                                    key={item.type}
                                                    type="button"
                                                    onClick={() => handlePeriodTypeChange(item.type as BudgetPeriodType)}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center p-2.5 rounded-2xl text-xs font-bold gap-1.5 transition-all text-center",
                                                        isSelected
                                                            ? "bg-primary text-primary-foreground shadow-neu-extruded-sm"
                                                            : "bg-background text-muted-foreground hover:text-foreground shadow-neu-inset-sm dark:shadow-neu-dark-inset-sm"
                                                    )}
                                                >
                                                    <IconComponent className="w-4 h-4" />
                                                    <span>{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Dynamic Period Controls */}
                                <div className="p-3.5 rounded-2xl bg-background shadow-neu-inset-sm dark:shadow-neu-dark-inset-sm space-y-3">
                                    {/* Start Month/Year Selector */}
                                    {(budgetFormData.period_type === 'monthly' || budgetFormData.period_type === 'custom_range' || budgetFormData.period_type === 'forever') && (
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                                                {budgetFormData.period_type === 'monthly' ? t('budget.start_period') : t('budget.start_period')}
                                            </Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="relative">
                                                    <select
                                                        className="appearance-none flex h-9 w-full rounded-xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-3 text-xs text-foreground font-semibold cursor-pointer outline-none"
                                                        value={budgetFormData.start_month || selectedMonth}
                                                        onChange={(e) => handleStartPeriodChange(Number(e.target.value), budgetFormData.start_year || selectedYear)}
                                                    >
                                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                            <option key={m} value={m}>{getFullMonthName(m)}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                                </div>
                                                <div className="relative">
                                                    <select
                                                        className="appearance-none flex h-9 w-full rounded-xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-3 text-xs text-foreground font-semibold cursor-pointer outline-none"
                                                        value={budgetFormData.start_year || selectedYear}
                                                        onChange={(e) => handleStartPeriodChange(budgetFormData.start_month || selectedMonth, Number(e.target.value))}
                                                    >
                                                        {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(y => (
                                                            <option key={y} value={y}>{y}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* For Yearly */}
                                    {budgetFormData.period_type === 'yearly' && (
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase">{t('budget.year_placeholder')}</Label>
                                            <div className="relative">
                                                <select
                                                    className="appearance-none flex h-9 w-full rounded-xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-3 text-xs text-foreground font-semibold cursor-pointer outline-none"
                                                    value={budgetFormData.start_year || selectedYear}
                                                    onChange={(e) => handleStartPeriodChange(1, Number(e.target.value))}
                                                >
                                                    {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Custom Range: Duration Stepper & Quick Chips */}
                                    {budgetFormData.period_type === 'custom_range' && (
                                        <div className="space-y-2 pt-1 border-t border-border/40">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-[11px] font-bold text-muted-foreground uppercase">{t('budget.duration_label')}</Label>
                                                <span className="text-xs font-extrabold text-primary font-mono">{durationMonths} Bulan</span>
                                            </div>

                                            {/* Quick Duration Buttons (e.g. 3, 6, 10, 12 Bulan) */}
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {[3, 6, 10, 12].map(num => (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        onClick={() => handleDurationMonthsChange(num)}
                                                        className={cn(
                                                            "py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center",
                                                            durationMonths === num
                                                                ? "bg-primary text-primary-foreground shadow-neu-extruded-sm"
                                                                : "bg-background text-muted-foreground hover:text-foreground shadow-neu-inset-sm"
                                                        )}
                                                    >
                                                        {num} Bln
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Stepper / Input */}
                                            <div className="flex items-center gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    className="h-8 w-8 rounded-lg bg-background shadow-neu-inset flex items-center justify-center font-bold text-foreground active:scale-95 transition-all"
                                                    onClick={() => handleDurationMonthsChange(durationMonths - 1)}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="range"
                                                    min={1}
                                                    max={24}
                                                    value={durationMonths}
                                                    onChange={(e) => handleDurationMonthsChange(Number(e.target.value))}
                                                    className="w-full accent-primary cursor-pointer"
                                                />
                                                <button
                                                    type="button"
                                                    className="h-8 w-8 rounded-lg bg-background shadow-neu-inset flex items-center justify-center font-bold text-foreground active:scale-95 transition-all"
                                                    onClick={() => handleDurationMonthsChange(durationMonths + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Preview Info Helper */}
                                    <div className="text-[11px] font-semibold text-primary flex items-center gap-1.5 pt-0.5">
                                        {budgetFormData.period_type === 'forever' && (
                                            <>
                                                <InfinityIcon className="w-3.5 h-3.5 shrink-0" />
                                                <span>{t('budget.valid_forever_preview', { start: `${getMonthName(budgetFormData.start_month || selectedMonth)} ${budgetFormData.start_year || selectedYear}` })}</span>
                                            </>
                                        )}
                                        {budgetFormData.period_type === 'yearly' && (
                                            <>
                                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                                <span>{t('budget.valid_yearly_preview', { year: budgetFormData.start_year || selectedYear })}</span>
                                            </>
                                        )}
                                        {budgetFormData.period_type === 'custom_range' && (
                                            <>
                                                <CalendarRange className="w-3.5 h-3.5 shrink-0" />
                                                <span>{t('budget.valid_range_preview', {
                                                    start: `${getMonthName(budgetFormData.start_month || selectedMonth)} ${budgetFormData.start_year || selectedYear}`,
                                                    end: `${getMonthName(budgetFormData.end_month || selectedMonth)} ${budgetFormData.end_year || selectedYear}`,
                                                    count: durationMonths
                                                })}</span>
                                            </>
                                        )}
                                        {budgetFormData.period_type === 'monthly' && (
                                            <>
                                                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                                                <span>Berlaku khusus {getMonthName(budgetFormData.start_month || selectedMonth)} {budgetFormData.start_year || selectedYear}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <Button type="submit" className="w-full mt-6 h-12 font-bold" disabled={createBudgetMutation.isPending}>
                                    {createBudgetMutation.isPending ? t('budget.saving') : t('budget.save_budget_btn')}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Hero All-in-One Budget Gauge Card */}
                <div className="p-6 sm:p-8 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded transition-all duration-300">
                    <div className="flex flex-col gap-6">
                        {/* Top: Remaining / Sisa Anggaran */}
                        <div className="flex items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary shrink-0">
                                    <Target className="h-6 w-6 sm:h-7 sm:w-7" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-muted-foreground block mb-0.5">
                                        {t('budget.remaining') || 'Sisa Anggaran'}
                                    </span>
                                    <h2 className={cn(
                                        "text-xl sm:text-3xl lg:text-4xl font-extrabold font-display tracking-tight whitespace-nowrap overflow-x-auto scrollbar-none",
                                        totalRemaining >= 0 ? "text-foreground" : "text-rose-500"
                                    )}>
                                        <CurrencyDisplay value={Math.abs(totalRemaining)} />
                                    </h2>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                                <span className={cn(
                                    "text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-full shadow-neu-inset-sm flex items-center gap-1.5 whitespace-nowrap",
                                    totalBudget > 0 && (totalSpent / totalBudget) > 0.9 ? "text-rose-500" : "text-primary"
                                )}>
                                    {totalBudget > 0 && (totalSpent / totalBudget) > 0.9 ? <AlertCircle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                    {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% {t('budget.used')}
                                </span>
                            </div>
                        </div>

                        {/* Middle: Gauge Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="h-3.5 w-full bg-background shadow-neu-inset-sm dark:shadow-neu-dark-inset-sm rounded-full overflow-hidden p-0.5">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000 ease-out shadow-neu-extruded-sm",
                                        totalBudget > 0 && (totalSpent / totalBudget) > 0.9 ? "bg-rose-500" : "bg-primary"
                                    )}
                                    style={{ width: `${totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Bottom: Inset Sub-wells for Total Budget & Total Spent */}
                        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                            {/* Total Budget */}
                            <div className="p-3 sm:p-4 rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[9px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block truncate">
                                        {t('budget.total_budget')}
                                    </span>
                                    <span className="text-xs sm:text-base font-extrabold font-mono text-foreground block mt-0.5 whitespace-nowrap overflow-x-auto scrollbar-none">
                                        <CurrencyDisplay value={totalBudget} />
                                    </span>
                                </div>
                            </div>

                            {/* Total Spent */}
                            <div className="p-3 sm:p-4 rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                                    <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[9px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block truncate">
                                        {t('budget.total_spent')}
                                    </span>
                                    <span className="text-xs sm:text-base font-extrabold font-mono text-rose-500 block mt-0.5 whitespace-nowrap overflow-x-auto scrollbar-none">
                                        <CurrencyDisplay value={totalSpent} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Budget List */}
                <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2">
                    {isLoading && <p className="text-muted-foreground font-medium animate-pulse">{t('budget.loading_budgets')}</p>}

                    {!isLoading && budgetStats.map((item) => {
                        const pType = item.period_type || 'monthly';
                        const startM = item.start_month ?? item.month;
                        const startY = item.start_year ?? item.year;
                        const endM = item.end_month ?? startM;
                        const endY = item.end_year ?? startY;
                        const isOver = item.percentage > 100;
                        const remaining = Number(item.budget_amount) - item.spent;

                        return (
                            <div
                                key={item.id}
                                className="p-5 sm:p-6 rounded-[28px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded hover:shadow-neu-extruded-hover transition-all duration-300 group flex flex-col justify-between gap-4"
                            >
                                {/* Header: Category & Actions */}
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-11 w-11 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary shrink-0">
                                            <Wallet className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold font-display text-base sm:text-lg text-foreground tracking-tight truncate">
                                                {item.categoryName}
                                            </h3>

                                            {/* Minimalist Period Badge */}
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {pType === 'forever' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-primary/90">
                                                        <InfinityIcon className="w-3 h-3" />
                                                        {t('budget.month_badge_forever')}
                                                    </span>
                                                )}
                                                {pType === 'yearly' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-blue-500">
                                                        <Calendar className="w-3 h-3" />
                                                        {t('budget.month_badge_yearly', { year: startY })}
                                                    </span>
                                                )}
                                                {pType === 'custom_range' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                                        <CalendarRange className="w-3 h-3" />
                                                        {getMonthName(startM)} - {getMonthName(endM)} {endY} ({item.monthProgress?.current || 1}/{item.monthProgress?.total || 1})
                                                    </span>
                                                )}
                                                {pType === 'monthly' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-muted-foreground">
                                                        <CalendarDays className="w-3 h-3" />
                                                        {getMonthName(startM)} {startY}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:shadow-neu-extruded-sm active:shadow-neu-inset-sm transition-all"
                                            onClick={() => handleBudgetEdit(item)}
                                            title="Edit"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:shadow-neu-extruded-sm active:shadow-neu-inset-sm transition-all"
                                            onClick={() => handleBudgetDelete(item.id)}
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Body: Amounts & Progress */}
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-baseline">
                                        <div className="font-mono font-bold text-foreground text-sm sm:text-base">
                                            <CurrencyDisplay value={item.spent} />
                                            <span className="text-xs text-muted-foreground font-normal ml-1.5">
                                                / <CurrencyDisplay value={Number(item.budget_amount)} />
                                            </span>
                                        </div>
                                        <span className={cn(
                                            "text-xs font-bold font-mono px-2 py-0.5 rounded-md",
                                            isOver ? "text-rose-500 bg-rose-500/10" : "text-primary bg-primary/10"
                                        )}>
                                            {item.percentage}%
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2.5 w-full bg-background shadow-neu-inset-sm dark:shadow-neu-dark-inset-sm rounded-full overflow-hidden p-0.5">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-700 ease-out",
                                                isOver ? "bg-rose-500" : "bg-primary"
                                            )}
                                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                                        />
                                    </div>

                                    {/* Bottom Info: Remaining */}
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-medium">
                                            {isOver ? t('budget.over') : t('budget.left')}
                                        </span>
                                        <span className={cn(
                                            "font-bold font-mono",
                                            isOver ? "text-rose-500" : "text-foreground"
                                        )}>
                                            <CurrencyDisplay value={Math.abs(remaining)} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {!isLoading && budgetStats.length === 0 && (
                    <div className="p-12 rounded-[32px] bg-background shadow-neu-extruded flex flex-col items-center justify-center gap-4 text-center">
                        <div className="h-16 w-16 rounded-3xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary">
                            <Wallet className="h-8 w-8 opacity-50" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground">Belum ada anggaran aktif untuk bulan ini</p>
                            <p className="text-sm text-muted-foreground mt-1">Buat anggaran bulanan, rentang waktu, atau selamanya untuk mengontrol pengeluaran kategori.</p>
                        </div>
                        <Button
                            className="mt-2 font-semibold"
                            onClick={() => {
                                resetBudgetForm();
                                setIsBudgetAddOpen(true);
                            }}
                        >
                            <Sparkles className="h-4 w-4 mr-2" /> {t('budget.set_budget')}
                        </Button>
                    </div>
                )}

                {/* Budget Edit Dialog */}
                <Dialog open={isBudgetEditOpen} onOpenChange={setIsBudgetEditOpen}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>{t('budget.edit_budget_title')}</DialogTitle>
                            <DialogDescription>{t('budget.edit_budget_desc')}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleBudgetSubmit} className="space-y-4 py-2">
                            {/* Amount Input */}
                            <div className="p-5 rounded-3xl bg-background shadow-neu-inset-deep flex flex-col items-center justify-center">
                                <Label htmlFor="edit-amount" className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{t('budget.limit_amount')}</Label>
                                <div className="flex items-baseline justify-center w-full">
                                    <span className="text-2xl sm:text-3xl font-extrabold text-muted-foreground mr-2">{currency === 'USD' ? '$' : 'Rp'}</span>
                                    <input
                                        id="edit-amount"
                                        type="text"
                                        inputMode="numeric"
                                        className="text-3xl sm:text-5xl font-extrabold font-mono bg-transparent border-none text-center w-full focus:ring-0 placeholder:text-muted-foreground/30 p-0 outline-none text-foreground"
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

                            {/* Category Selector */}
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-category" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-primary" /> {t('budget.category_label')}
                                </Label>
                                <div className="relative">
                                    <select
                                        id="edit-category"
                                        className="appearance-none flex h-11 w-full rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-4 text-sm text-foreground font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary"
                                        value={budgetFormData.category_id}
                                        onChange={(e) => setBudgetFormData({ ...budgetFormData, category_id: Number(e.target.value) })}
                                        required
                                    >
                                        {categories?.filter(c => c.type === 'expense').map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            {/* Duration / Period Type Tabs */}
                            <div className="space-y-2 pt-1">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-primary" /> {t('budget.period_type')}
                                </Label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { type: 'monthly', label: t('budget.period_monthly'), icon: CalendarDays },
                                        { type: 'custom_range', label: t('budget.period_custom_range'), icon: CalendarRange },
                                        { type: 'yearly', label: t('budget.period_yearly'), icon: Calendar },
                                        { type: 'forever', label: t('budget.period_forever'), icon: InfinityIcon },
                                    ].map(item => {
                                        const IconComponent = item.icon;
                                        const isSelected = (budgetFormData.period_type || 'monthly') === item.type;
                                        return (
                                            <button
                                                key={item.type}
                                                type="button"
                                                onClick={() => handlePeriodTypeChange(item.type as BudgetPeriodType)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-2.5 rounded-2xl text-xs font-bold gap-1.5 transition-all text-center",
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground shadow-neu-extruded-sm"
                                                        : "bg-background text-muted-foreground hover:text-foreground shadow-neu-inset-sm dark:shadow-neu-dark-inset-sm"
                                                )}
                                            >
                                                <IconComponent className="w-4 h-4" />
                                                <span>{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Dynamic Period Controls */}
                            <div className="p-3.5 rounded-2xl bg-background shadow-neu-inset-sm dark:shadow-neu-dark-inset-sm space-y-3">
                                {/* Start Month/Year Selector */}
                                {(budgetFormData.period_type === 'monthly' || budgetFormData.period_type === 'custom_range' || budgetFormData.period_type === 'forever') && (
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">{t('budget.start_period')}</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="relative">
                                                <select
                                                    className="appearance-none flex h-9 w-full rounded-xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-3 text-xs text-foreground font-semibold cursor-pointer outline-none"
                                                    value={budgetFormData.start_month || selectedMonth}
                                                    onChange={(e) => handleStartPeriodChange(Number(e.target.value), budgetFormData.start_year || selectedYear)}
                                                >
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                        <option key={m} value={m}>{getFullMonthName(m)}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                            </div>
                                            <div className="relative">
                                                <select
                                                    className="appearance-none flex h-9 w-full rounded-xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-3 text-xs text-foreground font-semibold cursor-pointer outline-none"
                                                    value={budgetFormData.start_year || selectedYear}
                                                    onChange={(e) => handleStartPeriodChange(budgetFormData.start_month || selectedMonth, Number(e.target.value))}
                                                >
                                                    {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* For Yearly */}
                                {budgetFormData.period_type === 'yearly' && (
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">{t('budget.year_placeholder')}</Label>
                                        <div className="relative">
                                            <select
                                                className="appearance-none flex h-9 w-full rounded-xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-3 text-xs text-foreground font-semibold cursor-pointer outline-none"
                                                value={budgetFormData.start_year || selectedYear}
                                                onChange={(e) => handleStartPeriodChange(1, Number(e.target.value))}
                                            >
                                                {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                {/* Custom Range: Duration Stepper & Quick Chips */}
                                {budgetFormData.period_type === 'custom_range' && (
                                    <div className="space-y-2 pt-1 border-t border-border/40">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase">{t('budget.duration_label')}</Label>
                                            <span className="text-xs font-extrabold text-primary font-mono">{durationMonths} Bulan</span>
                                        </div>

                                        {/* Quick Duration Buttons (e.g. 3, 6, 10, 12 Bulan) */}
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {[3, 6, 10, 12].map(num => (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    onClick={() => handleDurationMonthsChange(num)}
                                                    className={cn(
                                                        "py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center",
                                                        durationMonths === num
                                                            ? "bg-primary text-primary-foreground shadow-neu-extruded-sm"
                                                            : "bg-background text-muted-foreground hover:text-foreground shadow-neu-inset-sm"
                                                    )}
                                                >
                                                    {num} Bln
                                                </button>
                                            ))}
                                        </div>

                                        {/* Stepper / Input */}
                                        <div className="flex items-center gap-2 pt-1">
                                            <button
                                                type="button"
                                                className="h-8 w-8 rounded-lg bg-background shadow-neu-inset flex items-center justify-center font-bold text-foreground active:scale-95 transition-all"
                                                onClick={() => handleDurationMonthsChange(durationMonths - 1)}
                                            >
                                                -
                                            </button>
                                            <input
                                                type="range"
                                                min={1}
                                                max={24}
                                                value={durationMonths}
                                                onChange={(e) => handleDurationMonthsChange(Number(e.target.value))}
                                                className="w-full accent-primary cursor-pointer"
                                            />
                                            <button
                                                type="button"
                                                className="h-8 w-8 rounded-lg bg-background shadow-neu-inset flex items-center justify-center font-bold text-foreground active:scale-95 transition-all"
                                                onClick={() => handleDurationMonthsChange(durationMonths + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Preview Info Helper */}
                                <div className="text-[11px] font-semibold text-primary flex items-center gap-1.5 pt-0.5">
                                    {budgetFormData.period_type === 'forever' && (
                                        <>
                                            <InfinityIcon className="w-3.5 h-3.5 shrink-0" />
                                            <span>{t('budget.valid_forever_preview', { start: `${getMonthName(budgetFormData.start_month || selectedMonth)} ${budgetFormData.start_year || selectedYear}` })}</span>
                                        </>
                                    )}
                                    {budgetFormData.period_type === 'yearly' && (
                                        <>
                                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                                            <span>{t('budget.valid_yearly_preview', { year: budgetFormData.start_year || selectedYear })}</span>
                                        </>
                                    )}
                                    {budgetFormData.period_type === 'custom_range' && (
                                        <>
                                            <CalendarRange className="w-3.5 h-3.5 shrink-0" />
                                            <span>{t('budget.valid_range_preview', {
                                                start: `${getMonthName(budgetFormData.start_month || selectedMonth)} ${budgetFormData.start_year || selectedYear}`,
                                                end: `${getMonthName(budgetFormData.end_month || selectedMonth)} ${budgetFormData.end_year || selectedYear}`,
                                                count: durationMonths
                                            })}</span>
                                        </>
                                    )}
                                    {budgetFormData.period_type === 'monthly' && (
                                        <>
                                            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                                            <span>Berlaku khusus {getMonthName(budgetFormData.start_month || selectedMonth)} {budgetFormData.start_year || selectedYear}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" className="w-full mt-6 h-12 font-bold" disabled={updateBudgetMutation.isPending}>
                                {updateBudgetMutation.isPending ? t('budget.updating') : t('budget.update_budget_btn')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
