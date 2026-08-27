import { useState } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type Category } from '@/services/financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
import { Plus, Trash2, Tags, ChevronDown, Tag, ArrowUpRight, ArrowDownRight, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function CategoriesPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Form State
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState<Partial<Category>>({
        name: '',
        type: 'expense'
    });

    // Queries
    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: financialService.getCategories
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: financialService.createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsAddOpen(false);
            resetForm();
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number; cat: Partial<Category> }) => financialService.updateCategory(data.id, data.cat),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsEditOpen(false);
            setEditingCategory(null);
            resetForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: financialService.deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsEditOpen(false);
            setEditingCategory(null);
            resetForm();
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'expense'
        });
    };

    const handleCardClick = (cat: Category) => {
        setEditingCategory(cat);
        setFormData({
            name: cat.name,
            type: cat.type
        });
        setIsEditOpen(true);
    };

    const handleDelete = () => {
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (editingCategory) {
            deleteMutation.mutate(editingCategory.id);
        }
        setDeleteConfirmOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, cat: formData });
        } else {
            createMutation.mutate(formData);
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
                            resetForm();
                            setEditingCategory(null);
                            setIsAddOpen(true);
                        }}
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end">
                    <Button
                        onClick={() => { resetForm(); setEditingCategory(null); setIsAddOpen(true); }}
                        className="font-semibold gap-2 hidden sm:flex"
                    >
                        <Plus className="h-4 w-4" /> {t('categories.add_category')}
                    </Button>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-16 text-muted-foreground font-medium animate-pulse">{t('categories.loading')}</div>
                )}

                {/* Categories by Type */}
                {!isLoading && categories && categories.length > 0 && (
                    <div className="space-y-8">
                        {/* Expense Categories */}
                        {categories.filter(c => c.type === 'expense').length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2.5 px-2">
                                    <div className="h-8 w-8 rounded-xl bg-background shadow-neu-inset-deep flex items-center justify-center text-rose-500 shrink-0">
                                        <ArrowDownRight className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                        {t('categories.expenses_header')} ({categories.filter(c => c.type === 'expense').length})
                                    </h2>
                                </div>
                                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                                    {categories.filter(c => c.type === 'expense').map((cat) => (
                                        <div
                                            key={cat.id}
                                            onClick={() => handleCardClick(cat)}
                                            className="p-5 rounded-[28px] bg-background shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset-sm transition-all duration-300 flex items-center gap-3.5 cursor-pointer select-none group"
                                        >
                                            <div className="h-10 w-10 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-rose-500 shrink-0 group-hover:scale-105 transition-transform">
                                                <Tag className="h-4 w-4" />
                                            </div>
                                            <span className="font-bold text-sm text-foreground truncate">{cat.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Income Categories */}
                        {categories.filter(c => c.type === 'income').length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2.5 px-2">
                                    <div className="h-8 w-8 rounded-xl bg-background shadow-neu-inset-deep flex items-center justify-center text-neu-accent-sec shrink-0">
                                        <ArrowUpRight className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                        {t('categories.income_header')} ({categories.filter(c => c.type === 'income').length})
                                    </h2>
                                </div>
                                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                                    {categories.filter(c => c.type === 'income').map((cat) => (
                                        <div
                                            key={cat.id}
                                            onClick={() => handleCardClick(cat)}
                                            className="p-5 rounded-[28px] bg-background shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset-sm transition-all duration-300 flex items-center gap-3.5 cursor-pointer select-none group"
                                        >
                                            <div className="h-10 w-10 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-neu-accent-sec shrink-0 group-hover:scale-105 transition-transform">
                                                <Tag className="h-4 w-4" />
                                            </div>
                                            <span className="font-bold text-sm text-foreground truncate">{cat.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Saving Categories */}
                        {categories.filter(c => c.type === 'saving').length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2.5 px-2">
                                    <div className="h-8 w-8 rounded-xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary shrink-0">
                                        <PiggyBank className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                        {t('categories.savings_header')} ({categories.filter(c => c.type === 'saving').length})
                                    </h2>
                                </div>
                                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                                    {categories.filter(c => c.type === 'saving').map((cat) => (
                                        <div
                                            key={cat.id}
                                            onClick={() => handleCardClick(cat)}
                                            className="p-5 rounded-[28px] bg-background shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset-sm transition-all duration-300 flex items-center gap-3.5 cursor-pointer select-none group"
                                        >
                                            <div className="h-10 w-10 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                                                <Tag className="h-4 w-4" />
                                            </div>
                                            <span className="font-bold text-sm text-foreground truncate">{cat.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && categories?.length === 0 && (
                    <div className="p-12 rounded-[32px] bg-background shadow-neu-extruded flex flex-col items-center justify-center gap-4 text-center">
                        <div className="h-16 w-16 rounded-3xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary">
                            <Tags className="h-8 w-8 opacity-50" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground">{t('categories.no_categories')}</p>
                            <p className="text-sm text-muted-foreground mt-1">{t('categories.no_categories_desc')}</p>
                        </div>
                        <Button
                            className="mt-2 font-semibold"
                            onClick={() => {
                                resetForm();
                                setEditingCategory(null);
                                setIsAddOpen(true);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" /> {t('categories.add_category')}
                        </Button>
                    </div>
                )}

                {/* Add Category Dialog */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{t('categories.add_category')}</DialogTitle>
                            <DialogDescription>{t('categories.create_desc')}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('categories.name_label')}</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t('categories.enter_name')}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('categories.type_label')}</Label>
                                <div className="relative">
                                    <select
                                        className="appearance-none flex h-11 w-full rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-4 text-sm text-foreground font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        required
                                    >
                                        <option value="expense">💸 {t('categories.expense')}</option>
                                        <option value="income">💰 {t('categories.income')}</option>
                                        <option value="saving">🏦 {t('categories.saving')}</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <Button type="submit" className="w-full mt-6 h-12 font-bold" disabled={createMutation.isPending}>
                                {createMutation.isPending ? t('categories.saving_btn') : t('categories.save_btn')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Category Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{t('categories.edit_category')}</DialogTitle>
                            <DialogDescription>{t('categories.update_desc')}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('categories.name_label')}</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('categories.type_label')}</Label>
                                <div className="relative">
                                    <select
                                        className="appearance-none flex h-11 w-full rounded-2xl bg-background shadow-neu-inset dark:shadow-neu-dark-inset px-4 text-sm text-foreground font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
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
                                <Button type="submit" className="w-full h-12 font-bold" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? t('categories.updating') : t('categories.update_btn')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="w-full h-12 font-bold"
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> {t('categories.delete_btn')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Category Delete Confirmation */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('categories.delete_title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('categories.delete_confirm', { name: editingCategory?.name })}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                                {t('categories.delete_btn')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}
