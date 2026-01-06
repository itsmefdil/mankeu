import { useState } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type Category } from '@/services/financial';
import { Button } from '@/components/ui/button';
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
import { Plus, Trash2, Tags, ChevronDown, Type } from 'lucide-react';
import { cn } from '@/lib/utils';


export default function CategoriesPage() {
    const queryClient = useQueryClient();

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
        mutationFn: (data: { id: number, cat: Partial<Category> }) => financialService.updateCategory(data.id, data.cat),
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

    // Form Content Component (shared between Dialog and Sheet)
    const CategoryForm = ({ isEditing = false }: { isEditing?: boolean }) => (
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-background">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

                {/* 1. Category Name Input - Centerpiece */}
                <div className="relative py-4 sm:py-6 bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                    <Label htmlFor="cat-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Category Name</Label>
                    <div className="w-full px-4 sm:px-8">
                        <input
                            id="cat-name"
                            type="text"
                            className="text-2xl sm:text-3xl font-bold bg-transparent border-none text-center w-full focus:ring-0 placeholder:text-muted-foreground/30 p-0 outline-none hover:outline-none"
                            placeholder="Enter name..."
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            autoFocus
                        />
                    </div>
                </div>

                {/* 2. Type Select - Custom Styled */}
                <div className="space-y-2">
                    <Label htmlFor="cat-type" className="text-sm font-medium flex items-center gap-2">
                        <Type className="w-4 h-4 text-primary" /> Category Type
                    </Label>
                    <div className="relative">
                        <select
                            id="cat-type"
                            className="appearance-none flex h-14 w-full items-center justify-between rounded-xl border border-input bg-background/50 px-4 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 relative z-10 bg-transparent font-medium"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            required
                        >
                            <option value="expense">💸 Expense</option>
                            <option value="income">💰 Income</option>
                            <option value="saving">🏦 Saving</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-0 pointer-events-none" />
                        <div className="absolute inset-0 rounded-xl bg-card border border-input pointer-events-none -z-10" />
                    </div>
                </div>

            </div>

            {/* Action Buttons */}
            <div className="pt-4 pb-2 border-t border-border mt-auto space-y-3">
                <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold shadow-lg rounded-xl"
                    disabled={isEditing ? updateMutation.isPending : createMutation.isPending}
                >
                    {isEditing
                        ? (updateMutation.isPending ? 'Updating...' : 'Update Category')
                        : (createMutation.isPending ? 'Saving...' : 'Save Category')
                    }
                </Button>

                {/* Delete Button - Only show in edit mode */}
                {isEditing && (
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-12 text-base font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete Category'}
                    </Button>
                )}
            </div>
        </form>
    );

    // Reusable Category Card Component
    const CategoryCard = ({ cat, colorClass }: { cat: Category; colorClass: string }) => (
        <div
            onClick={() => handleCardClick(cat)}
            className="p-3 sm:p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col group relative overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.98]"
        >
            <div className="flex items-start justify-between mb-2">
                <div className={cn("p-2 rounded-lg", colorClass)}>
                    <Tags className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
            </div>
            <p className="font-semibold text-sm sm:text-base truncate">{cat.name}</p>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-display font-bold">Categories</h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage expense and income categories</p>
                    </div>
                    <Button onClick={() => { resetForm(); setEditingCategory(null); setIsAddOpen(true); }} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Add Category
                    </Button>
                </div>

                {/* Unified Add Category Dialog */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className={cn(
                        "flex flex-col gap-0 p-0 overflow-hidden",
                        "w-full sm:w-auto h-[100dvh] sm:h-auto", // Mobile: Fullscreen, Desktop: Auto
                        "sm:max-w-[425px] sm:rounded-2xl", // Desktop styling
                        "border-0 sm:border"
                    )}>
                        <DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0">
                            <DialogTitle>Add Category</DialogTitle>
                            <DialogDescription>Create a new category.</DialogDescription>
                        </DialogHeader>
                        <CategoryForm />
                    </DialogContent>
                </Dialog>

                {/* Unified Edit Category Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className={cn(
                        "flex flex-col gap-0 p-0 overflow-hidden",
                        "w-full sm:w-auto h-[100dvh] sm:h-auto",
                        "sm:max-w-[425px] sm:rounded-2xl",
                        "border-0 sm:border"
                    )}>
                        <DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0">
                            <DialogTitle>Edit Category</DialogTitle>
                            <DialogDescription>Update or delete this category.</DialogDescription>
                        </DialogHeader>
                        <CategoryForm isEditing />
                    </DialogContent>
                </Dialog>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
                )}

                {/* Categories by Type */}
                {!isLoading && categories && categories.length > 0 && (
                    <div className="space-y-6">
                        {/* Expense Categories */}
                        {categories.filter(c => c.type === 'expense').length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                                    Expenses ({categories.filter(c => c.type === 'expense').length})
                                </h2>
                                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {categories.filter(c => c.type === 'expense').map((cat) => (
                                        <CategoryCard
                                            key={cat.id}
                                            cat={cat}
                                            colorClass="bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Income Categories */}
                        {categories.filter(c => c.type === 'income').length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                                    Income ({categories.filter(c => c.type === 'income').length})
                                </h2>
                                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {categories.filter(c => c.type === 'income').map((cat) => (
                                        <CategoryCard
                                            key={cat.id}
                                            cat={cat}
                                            colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Saving Categories */}
                        {categories.filter(c => c.type === 'saving').length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                                    Savings ({categories.filter(c => c.type === 'saving').length})
                                </h2>
                                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {categories.filter(c => c.type === 'saving').map((cat) => (
                                        <CategoryCard
                                            key={cat.id}
                                            cat={cat}
                                            colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && categories?.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-border rounded-xl">
                        <div className="flex flex-col items-center gap-2">
                            <Tags className="h-10 w-10 text-muted-foreground/50" />
                            <h3 className="text-lg font-semibold">No categories yet</h3>
                            <p className="text-muted-foreground text-sm">Create your first category to organize transactions.</p>
                            <Button variant="outline" className="mt-4" onClick={() => setIsAddOpen(true)}>Add Category</Button>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-3">
                                <div className="p-2 bg-destructive/10 rounded-lg">
                                    <Trash2 className="h-5 w-5 text-destructive" />
                                </div>
                                Delete Category
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-base">
                                Are you sure you want to delete "{editingCategory?.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2 sm:gap-0">
                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                            >
                                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}
