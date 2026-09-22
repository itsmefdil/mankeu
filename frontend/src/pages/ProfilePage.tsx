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
    Coins,
    Heart,
    Tags,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';

export default function ProfilePage() {
    const { t } = useTranslation();
    const { user, logout } = useAuthStore();
    const { toggleTheme } = useTheme();
    const { language, currency, avatarSeed, randomizeAvatar } = usePreferencesStore();
    const avatarName = avatarSeed || user?.email || user?.name || 'mankeu';

    const menuGroups = [
        {
            title: t('profile.finance_features'),
            items: [
                {
                    label: t('nav.accounts'),
                    desc: t('profile.accounts_desc'),
                    icon: Wallet,
                    href: '/accounts',
                    color: 'text-primary'
                },
                {
                    label: t('nav.analytics'),
                    desc: t('profile.analytics_desc'),
                    icon: BarChart3,
                    href: '/analytics',
                    color: 'text-neu-accent-sec'
                },
                {
                    label: t('nav.debts'),
                    desc: t('profile.debts_desc'),
                    icon: CreditCard,
                    href: '/debts',
                    color: 'text-rose-500'
                },
                {
                    label: t('nav.savings'),
                    desc: t('profile.savings_desc'),
                    icon: PiggyBank,
                    href: '/savings',
                    color: 'text-amber-500'
                },
                {
                    label: t('categories.title'),
                    desc: t('profile.categories_desc'),
                    icon: Tags,
                    href: '/categories',
                    color: 'text-primary'
                },
            ]
        },
        {
            title: t('profile.preferences_app'),
            items: [
                {
                    label: t('nav.settings'),
                    desc: t('profile.settings_desc'),
                    icon: Settings,
                    href: '/settings',
                    color: 'text-foreground'
                },
                {
                    label: t('profile.about_mankeu'),
                    desc: t('profile.about_desc'),
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
                        <div className="relative group shrink-0">
                            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl overflow-hidden shadow-neu-inset-deep flex items-center justify-center bg-background shrink-0">
                                <UserAvatar
                                    name={avatarName}
                                    size={76}
                                    animate="always"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => randomizeAvatar()}
                                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-xl bg-background shadow-neu-extruded-sm hover:shadow-neu-extruded-hover active:shadow-neu-inset-sm active:translate-y-0.5 transition-all duration-200 flex items-center justify-center text-primary"
                                title="Acak Karakter Avatar"
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-extrabold font-display text-foreground truncate">
                                {user?.name || t('profile.default_user')}
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate mt-0.5">
                                {user?.email || 'user@mankeu.app'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-background shadow-neu-inset-sm px-2.5 py-0.5 rounded-full">
                                    {t('profile.pro_plan')}
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
                            title={t('profile.toggle_theme')}
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
                    <h3 className="font-bold font-display text-lg text-foreground mt-1">{t('profile.mankeu_finance')}</h3>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        {t('profile.about_footer_desc')}
                    </p>
                    <span className="text-[11px] font-semibold text-muted-foreground mt-2 flex items-center gap-1">
                        {t('profile.made_with')} <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> {t('profile.for_your_comfort')}
                    </span>
                </div>
            </div>
        </DashboardLayout>
    );
}
