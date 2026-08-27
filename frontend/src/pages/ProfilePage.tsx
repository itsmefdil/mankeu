import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { usePreferencesStore } from '@/hooks/usePreferences';
import {
    Wallet,
    BarChart3,
    CreditCard,
    PiggyBank,
    Settings,
    Info,
    ChevronRight,
    LogOut,
    Sun,
    Moon,
    Shield,
    Smartphone,
    UserCircle2,
    Coins,
    Heart,
    Tags
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
    const { t } = useTranslation();
    const { user, logout } = useAuthStore();
    const { theme, toggleTheme } = useTheme();
    const { language, currency } = usePreferencesStore();

    const menuGroups = [
        {
            title: 'Keuangan & Fitur',
            items: [
                {
                    label: t('nav.accounts') || 'Accounts',
                    desc: 'Kelola dompet dan rekening bank',
                    icon: Wallet,
                    href: '/accounts',
                    color: 'text-primary'
                },
                {
                    label: t('nav.analytics') || 'Analytics',
                    desc: 'Analisis tren pemasukan & pengeluaran',
                    icon: BarChart3,
                    href: '/analytics',
                    color: 'text-neu-accent-sec'
                },
                {
                    label: t('nav.debts') || 'Debts & Loans',
                    desc: 'Catatan hutang & piutang',
                    icon: CreditCard,
                    href: '/debts',
                    color: 'text-rose-500'
                },
                {
                    label: t('nav.savings') || 'Savings',
                    desc: 'Target dan tabungan masa depan',
                    icon: PiggyBank,
                    href: '/savings',
                    color: 'text-amber-500'
                },
                {
                    label: t('categories.title') || 'Categories',
                    desc: 'Kelola kategori pemasukan & pengeluaran',
                    icon: Tags,
                    href: '/categories',
                    color: 'text-primary'
                },
            ]
        },
        {
            title: 'Preferensi & Aplikasi',
            items: [
                {
                    label: t('nav.settings') || 'Settings',
                    desc: 'Profil, bahasa, mata uang, & notifikasi',
                    icon: Settings,
                    href: '/settings',
                    color: 'text-foreground'
                },
                {
                    label: 'Tentang Mankeu',
                    desc: 'Versi 1.0.0 • Dibuat dengan cinta',
                    icon: Info,
                    href: '/settings#about',
                    color: 'text-primary'
                },
            ]
        }
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 sm:gap-8 w-full pb-20 md:pb-8 px-1 sm:px-0">
                {/* User Card */}
                <div className="p-6 sm:p-8 rounded-[32px] bg-background shadow-neu-extruded dark:shadow-neu-dark-extruded flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl overflow-hidden shadow-neu-inset-deep flex items-center justify-center bg-background shrink-0">
                            {user?.picture ? (
                                <img src={user.picture} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                <UserCircle2 className="h-12 w-12 text-primary" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-extrabold font-display text-foreground truncate">
                                {user?.name || 'Mankeu User'}
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate mt-0.5">
                                {user?.email || 'user@mankeu.app'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-background shadow-neu-inset-sm px-2.5 py-0.5 rounded-full">
                                    Pro Plan
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground bg-background shadow-neu-inset-sm px-2.5 py-0.5 rounded-full">
                                    {currency} • {language.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={toggleTheme}
                            className="rounded-2xl"
                            title="Toggle Theme"
                        >
                            <Sun className="h-5 w-5 dark:hidden" />
                            <Moon className="h-5 w-5 hidden dark:block" />
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={logout}
                            className="font-bold gap-2 rounded-2xl"
                        >
                            <LogOut className="h-4 w-4" /> {t('nav.logout')}
                        </Button>
                    </div>
                </div>

                {/* Menu Groups */}
                <div className="space-y-6">
                    {menuGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
                                {group.title}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {group.items.map((item, itemIdx) => (
                                    <Link
                                        key={itemIdx}
                                        to={item.href}
                                        className="p-5 rounded-[28px] bg-background shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset-sm transition-all duration-300 flex items-center justify-between gap-4 group select-none"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="h-12 w-12 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                <item.icon className={cn("h-6 w-6", item.color)} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                                                    {item.label}
                                                </h4>
                                                <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="h-8 w-8 rounded-xl bg-background shadow-neu-extruded-sm flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:shadow-neu-inset-sm transition-all shrink-0">
                                            <ChevronRight className="h-4 w-4" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* About Mankeu Footprint */}
                <div className="p-6 sm:p-8 rounded-[32px] bg-background shadow-neu-extruded text-center flex flex-col items-center justify-center gap-2">
                    <div className="h-12 w-12 rounded-2xl bg-background shadow-neu-inset-deep flex items-center justify-center text-primary">
                        <Coins className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold font-display text-lg text-foreground mt-1">Mankeu Finance</h3>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        Aplikasi manajemen keuangan pribadi dengan estetika Neumorphic Soft UI. Kelola pengeluaran, anggaran, dan tabungan Anda secara mandiri.
                    </p>
                    <span className="text-[11px] font-semibold text-muted-foreground mt-2 flex items-center gap-1">
                        Dibuat dengan <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> untuk kenyamanan finansial Anda
                    </span>
                </div>
            </div>
        </DashboardLayout>
    );
}
