
import { useState } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type Account, type Transfer } from '@/services/financial';
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
import { Plus, Trash2, Pencil, ArrowRightLeft, CreditCard, Banknote, Smartphone, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { useTranslation } from 'react-i18next';

import { PullToRefresh } from '@/components/PullToRefresh';
import { SwipeableItem } from '@/components/SwipeableItem';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Haptic feedback helper
const vibrate = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

export default function AccountsPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Transfer State
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [transferData, setTransferData] = useState<Partial<Transfer>>({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Form State
    const [formData, setFormData] = useState<Partial<Account>>({
        name: '',
        type: 'cash',
        balance: 0,
        is_default: false,
    });

    // Queries
    const { data: accounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: financialService.getAccounts
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: financialService.createAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            setIsAddOpen(false);
            resetForm();
            vibrate([50, 30, 50]);
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number, account: Partial<Account> }) =>
            financialService.updateAccount(data.id, data.account),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            setIsEditOpen(false);
            setEditingAccount(null);
            resetForm();
            vibrate(10);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: financialService.deleteAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            setDeleteConfirmOpen(false);
            setEditingAccount(null);
            vibrate([50, 50]);
        },
        onError: () => {
            // Handle error (e.g. existing transactions)
            alert(t('accounts.delete_error') || 'Cannot delete account with transactions');
        }
    });

    const transferMutation = useMutation({
        mutationFn: financialService.createTransfer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['transfers'] });
            setIsTransferOpen(false);
            resetTransferForm();
            vibrate([50, 100]);
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'cash',
            balance: 0,
            is_default: false,
        });
    };

    const resetTransferForm = () => {
        setTransferData({
            from_account_id: undefined,
            to_account_id: undefined,
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            notes: ''
        });
    };

    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        setFormData({
            name: account.name,
            type: account.type,
            balance: Number(account.balance), // Allow editing balance?
            is_default: account.is_default
        });
        setIsEditOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAccount) {
            updateMutation.mutate({ id: editingAccount.id, account: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleTransferSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferData.from_account_id || !transferData.to_account_id || (transferData.amount || 0) <= 0) return;
        transferMutation.mutate(transferData);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'bank': return <CreditCard className="w-5 h-5" />;
            case 'ewallet': return <Smartphone className="w-5 h-5" />;
            default: return <Banknote className="w-5 h-5" />;
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-20 md:pb-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-display font-bold truncate">{t('nav.accounts') || 'Accounts'}</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl hidden sm:flex"
                            onClick={() => {
                                resetTransferForm();
                                setIsTransferOpen(true);
                            }}
                        >
                            <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
                        </Button>
                        <Button
                            className="shadow-lg shadow-primary/20 rounded-xl"
                            onClick={() => {
                                resetForm();
                                setIsAddOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> {t('common.add') || 'Add Account'}
                        </Button>
                    </div>
                </div>

                {/* Mobile Transfer Button (Floating?) or regular */}
                {!isDesktop && (
                    <Button
                        variant="secondary"
                        className="w-full rounded-xl shadow-sm border border-border sm:hidden"
                        onClick={() => {
                            resetTransferForm();
                            setIsTransferOpen(true);
                        }}
                    >
                        <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Funds
                    </Button>
                )}

                {/* Accounts Grid */}
                <PullToRefresh onRefresh={async () => {
                    await queryClient.invalidateQueries({ queryKey: ['accounts'] });
                }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {accounts?.map((account) => (
                            <SwipeableItem
                                key={account.id}
                                onSwipeLeft={() => {
                                    setEditingAccount(account);
                                    setDeleteConfirmOpen(true);
                                }}
                                onSwipeRight={() => handleEdit(account)}
                                vibrate={() => vibrate(10)}
                                leftContent={<Trash2 className="w-5 h-5 text-white" />}
                                rightContent={<Pencil className="w-5 h-5 text-white" />}
                                className="h-full"
                            >
                                <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-4 h-full relative overflow-hidden group">
                                    {account.is_default && (
                                        <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-bl-xl uppercase tracking-wider">
                                            Default
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-3 rounded-xl",
                                                account.type === 'bank' ? "bg-blue-500/10 text-blue-600" :
                                                    account.type === 'ewallet' ? "bg-purple-500/10 text-purple-600" :
                                                        "bg-emerald-500/10 text-emerald-600"
                                            )}>
                                                {getIcon(account.type)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{account.name}</h3>
                                                <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-2">
                                        <p className="text-xs text-muted-foreground mb-1">Balance</p>
                                        <p className="text-2xl font-bold font-display">
                                            <CurrencyDisplay value={Number(account.balance)} />
                                        </p>
                                    </div>
                                </div>
                            </SwipeableItem>
                        ))}
                    </div>
                </PullToRefresh>

                {/* Add/Edit Dialog */}
                <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
                    if (!open) {
                        setIsAddOpen(false);
                        setIsEditOpen(false);
                    }
                }}>
                    <DialogContent className="sm:max-w-[425px] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>{isEditOpen ? 'Edit Account' : 'Add New Account'}</DialogTitle>
                            <DialogDescription>
                                {isEditOpen ? 'Update account details' : 'Create a new account to track your funds'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Account Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. BCA, Wallet, OVO"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <div className="relative">
                                    <select
                                        className="appearance-none flex h-12 w-full items-center justify-between rounded-xl border border-input bg-card px-4 py-2 text-base shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 relative z-10"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="cash">Cash (Tunai)</option>
                                        <option value="bank">Bank</option>
                                        <option value="ewallet">E-Wallet</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-0 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Initial Balance</Label>
                                <Input
                                    type="number"
                                    value={formData.balance}
                                    onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                                    placeholder="0"
                                />
                                {isEditOpen && <p className="text-xs text-muted-foreground">Adjusting this creates a balance correction.</p>}
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <div
                                    className={cn(
                                        "w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors",
                                        formData.is_default ? "bg-primary border-primary text-primary-foreground" : "border-input"
                                    )}
                                    onClick={() => setFormData({ ...formData, is_default: !formData.is_default })}
                                >
                                    {formData.is_default && <Check className="w-3.5 h-3.5" />}
                                </div>
                                <Label onClick={() => setFormData({ ...formData, is_default: !formData.is_default })} className="cursor-pointer">
                                    Set as Default Account
                                </Label>
                            </div>
                            <Button type="submit" className="w-full mt-4 h-12 rounded-xl text-base" disabled={createMutation.isPending || updateMutation.isPending}>
                                {isEditOpen ? 'Update Account' : 'Create Account'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Transfer Dialog */}
                <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                    <DialogContent className="sm:max-w-[425px] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Transfer Funds</DialogTitle>
                            <DialogDescription>Move money between your accounts</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleTransferSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>From</Label>
                                    <div className="relative">
                                        <select
                                            className="appearance-none flex h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
                                            value={transferData.from_account_id || ''}
                                            onChange={(e) => setTransferData({ ...transferData, from_account_id: Number(e.target.value) })}
                                            required
                                        >
                                            <option value="" disabled>Select</option>
                                            {accounts?.map(a => (
                                                <option key={a.id} value={a.id} disabled={a.id === transferData.to_account_id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>To</Label>
                                    <div className="relative">
                                        <select
                                            className="appearance-none flex h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
                                            value={transferData.to_account_id || ''}
                                            onChange={(e) => setTransferData({ ...transferData, to_account_id: Number(e.target.value) })}
                                            required
                                        >
                                            <option value="" disabled>Select</option>
                                            {accounts?.map(a => (
                                                <option key={a.id} value={a.id} disabled={a.id === transferData.from_account_id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">Rp</span>
                                    <Input
                                        type="number"
                                        className="pl-10 h-14 text-2xl font-bold"
                                        value={transferData.amount || ''}
                                        onChange={(e) => setTransferData({ ...transferData, amount: Number(e.target.value) })}
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={transferData.date}
                                    onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Input
                                    value={transferData.notes}
                                    onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                                    placeholder="e.g. Credit Card Payment"
                                />
                            </div>

                            <Button type="submit" className="w-full mt-4 h-12 rounded-xl text-base" disabled={transferMutation.isPending}>
                                {transferMutation.isPending ? 'Processing...' : 'Transfer Now'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete {editingAccount?.name}? This action cannot be undone.
                                Note: You cannot delete an account if it has associated transactions.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => editingAccount && deleteMutation.mutate(editingAccount.id)} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}
