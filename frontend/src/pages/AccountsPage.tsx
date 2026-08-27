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
import { Plus, Trash2, Pencil, ArrowRightLeft, CreditCard, Banknote, Smartphone, ChevronDown, Check, Wallet, Landmark } from 'lucide-react';
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

    // Total Net Worth Calculation
    const totalBalance = accounts?.reduce((acc, curr) => acc + Number(curr.balance), 0) || 0;

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
            balance: Number(account.balance),
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
            <div className="flex flex-col gap-6 sm:gap-8 w-full pb-20 md:pb-8 px-1 sm:px-0">
                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        variant="secondary"
                        className="font-semibold gap-2"
                        onClick={() => {
                            resetTransferForm();
                            setIsTransferOpen(true);
                        }}
                    >
                        <ArrowRightLeft className="h-4 w-4 text-neu-accent-sec" /> Transfer
                    </Button>
                    <Button
                        className="font-semibold gap-2"
                        onClick={() => {
                            resetForm();
                            setIsAddOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4" /> {t('common.add') || 'Tambah Akun'}
                    </Button>
                </div>

                {/* Total Balance Card */}
                <div className="p-6 sm:p-8 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-background shadow-neu-inset-deep dark:shadow-neu-dark-inset-deep flex items-center justify-center text-primary shrink-0">
                            <Landmark className="h-7 w-7" />
                        </div>
                        <div>
                            <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                                Total Saldo Seluruh Akun
                            </span>
                            <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-foreground">
                                <CurrencyDisplay value={totalBalance} />
                            </h2>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-primary bg-background shadow-neu-inset-sm px-3.5 py-1.5 rounded-full hidden sm:inline-block">
                        {accounts?.length || 0} Akun Aktif
                    </span>
                </div>

                {/* Accounts Grid */}
                <PullToRefresh onRefresh={async () => {
                    await queryClient.invalidateQueries({ queryKey: ['accounts'] });
                }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                                <div className="p-6 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded hover:shadow-neu-extruded-hover dark:hover:shadow-neu-dark-extruded-hover transition-all duration-300 flex flex-col justify-between gap-6 h-full relative group">
                                    {account.is_default && (
                                        <div className="absolute top-4 right-4 bg-background shadow-neu-inset-sm text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            Default
                                        </div>
                                    )}

                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3.5">
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl bg-background shadow-neu-inset-deep dark:shadow-neu-dark-inset-deep flex items-center justify-center shrink-0",
                                                account.type === 'bank' ? "text-primary" :
                                                    account.type === 'ewallet' ? "text-neu-accent-sec" :
                                                        "text-amber-500"
                                            )}>
                                                {getIcon(account.type)}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-lg text-foreground truncate">{account.name}</h3>
                                                <p className="text-xs text-muted-foreground capitalize font-medium">{account.type}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">Saldo Akun</p>
                                        <p className="text-2xl font-extrabold font-display text-foreground tracking-tight">
                                            <CurrencyDisplay value={Number(account.balance)} />
                                        </p>
                                    </div>

                                    {/* Action Buttons for Desktop */}
                                    {isDesktop && (
                                        <div className="flex items-center gap-2 pt-2 border-t border-background shadow-neu-inset-sm rounded-xl p-1 justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(account)}
                                                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:shadow-neu-extruded-sm active:shadow-neu-inset-sm transition-all"
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingAccount(account);
                                                    setDeleteConfirmOpen(true);
                                                }}
                                                className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:shadow-neu-extruded-sm active:shadow-neu-inset-sm transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </SwipeableItem>
                        ))}
                    </div>
                </PullToRefresh>

                {(!accounts || accounts.length === 0) && (
                    <div className="p-12 rounded-[32px] bg-background shadow-neu-extruded flex flex-col items-center justify-center gap-4 text-center">
                        <div className="h-16 w-16 rounded-3xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary">
                            <Wallet className="h-8 w-8 opacity-50" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground">Belum ada akun terdaftar</p>
                            <p className="text-sm text-muted-foreground mt-1">Tambahkan akun pertama Anda untuk mulai mengelola saldo.</p>
                        </div>
                        <Button
                            className="mt-2 font-semibold"
                            onClick={() => {
                                resetForm();
                                setIsAddOpen(true);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Tambah Akun
                        </Button>
                    </div>
                )}

                {/* Add/Edit Dialog */}
                <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
                    if (!open) {
                        setIsAddOpen(false);
                        setIsEditOpen(false);
                    }
                }}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{isEditOpen ? 'Edit Akun' : 'Tambah Akun Baru'}</DialogTitle>
                            <DialogDescription>
                                {isEditOpen ? 'Perbarui informasi detail akun Anda' : 'Buat akun dompet atau rekening baru untuk mencatat saldo Anda'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Akun</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: BCA, Dompet Tunai, GoPay"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tipe Akun</Label>
                                <div className="relative">
                                    <select
                                        className="appearance-none flex h-11 w-full items-center justify-between rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background font-semibold cursor-pointer"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="cash">Cash (Tunai)</option>
                                        <option value="bank">Bank</option>
                                        <option value="ewallet">E-Wallet</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Saldo {isEditOpen ? 'Koreksi' : 'Awal'}</Label>
                                <Input
                                    type="number"
                                    value={formData.balance}
                                    onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    className={cn(
                                        "w-6 h-6 rounded-xl flex items-center justify-center transition-all shadow-neu-inset-sm",
                                        formData.is_default ? "text-primary font-bold shadow-neu-inset-deep" : "text-transparent"
                                    )}
                                    onClick={() => setFormData({ ...formData, is_default: !formData.is_default })}
                                >
                                    <Check className="w-4 h-4 text-primary" />
                                </button>
                                <Label onClick={() => setFormData({ ...formData, is_default: !formData.is_default })} className="cursor-pointer font-semibold text-sm">
                                    Jadikan Akun Utama (Default)
                                </Label>
                            </div>
                            <Button type="submit" className="w-full mt-6 h-12 font-bold" disabled={createMutation.isPending || updateMutation.isPending}>
                                {isEditOpen ? 'Perbarui Akun' : 'Buat Akun'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Transfer Dialog */}
                <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Transfer Dana</DialogTitle>
                            <DialogDescription>Pindahkan saldo antar akun keuangan Anda</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleTransferSubmit} className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dari Akun</Label>
                                    <div className="relative">
                                        <select
                                            className="appearance-none flex h-11 w-full rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold cursor-pointer"
                                            value={transferData.from_account_id || ''}
                                            onChange={(e) => setTransferData({ ...transferData, from_account_id: Number(e.target.value) })}
                                            required
                                        >
                                            <option value="" disabled>Pilih Akun</option>
                                            {accounts?.map(a => (
                                                <option key={a.id} value={a.id} disabled={a.id === transferData.to_account_id}>{a.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ke Akun</Label>
                                    <div className="relative">
                                        <select
                                            className="appearance-none flex h-11 w-full rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold cursor-pointer"
                                            value={transferData.to_account_id || ''}
                                            onChange={(e) => setTransferData({ ...transferData, to_account_id: Number(e.target.value) })}
                                            required
                                        >
                                            <option value="" disabled>Pilih Akun</option>
                                            {accounts?.map(a => (
                                                <option key={a.id} value={a.id} disabled={a.id === transferData.from_account_id}>{a.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nominal Transfer</Label>
                                <Input
                                    type="number"
                                    deep
                                    className="h-14 text-2xl font-bold font-mono"
                                    value={transferData.amount || ''}
                                    onChange={(e) => setTransferData({ ...transferData, amount: Number(e.target.value) })}
                                    placeholder="0"
                                    required
                                    min="1"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tanggal</Label>
                                <Input
                                    type="date"
                                    value={transferData.date}
                                    onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Catatan (Opsional)</Label>
                                <Input
                                    value={transferData.notes}
                                    onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                                    placeholder="Contoh: Isi saldo e-wallet / Bayar tagihan"
                                />
                            </div>

                            <Button type="submit" className="w-full mt-6 h-12 font-bold" disabled={transferMutation.isPending}>
                                {transferMutation.isPending ? 'Memproses...' : 'Transfer Sekarang'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Akun Ini?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus akun <strong>{editingAccount?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                                Catatan: Akun yang memiliki transaksi terkait tidak dapat dihapus.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => editingAccount && deleteMutation.mutate(editingAccount.id)} className="bg-destructive text-destructive-foreground">
                                Hapus Akun
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}
