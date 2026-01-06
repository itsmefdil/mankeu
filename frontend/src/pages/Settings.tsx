import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { usePreferencesStore } from '@/hooks/usePreferences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Moon, Sun, Monitor, LogOut, Shield, Bell, HelpCircle, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
    const { user, logout } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const { currency, language, setCurrency, setLanguage } = usePreferencesStore();
    const { t } = useTranslation();

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8 pb-10">
                <div>
                    <h1 className="text-3xl font-display font-bold">{t('settings.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('settings.description')}</p>
                </div>

                {/* Profile Section */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <h2 className="font-bold text-lg">{t('settings.profile_title')}</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{t('settings.profile_desc')}</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('settings.full_name')}</Label>
                                <Input id="name" defaultValue={user?.name} disabled />
                                <p className="text-[0.8rem] text-muted-foreground">{t('settings.name_help')}</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('settings.email_label')}</Label>
                                <Input id="email" defaultValue={user?.email} disabled />
                                <p className="text-[0.8rem] text-muted-foreground">{t('settings.email_help')}</p>
                            </div>
                        </div>
                    </div>
                </div>



                {/* Localization Section */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            <h2 className="font-bold text-lg">{t('settings.localization_title')}</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{t('settings.localization_desc')}</p>
                    </div>
                    <div className="p-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-3">
                                <Label>{t('settings.language_label')}</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setLanguage('id')}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 transition-all hover:bg-surface-hover",
                                            language === 'id' ? "border-primary bg-primary/5" : "border-border bg-transparent"
                                        )}
                                    >
                                        <span className="text-2xl">🇮🇩</span>
                                        <span className="text-sm font-medium">Indonesia</span>
                                    </button>
                                    <button
                                        onClick={() => setLanguage('en')}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 transition-all hover:bg-surface-hover",
                                            language === 'en' ? "border-primary bg-primary/5" : "border-border bg-transparent"
                                        )}
                                    >
                                        <span className="text-2xl">🇺🇸</span>
                                        <span className="text-sm font-medium">English</span>
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label>{t('settings.currency_label')}</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setCurrency('IDR')}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 transition-all hover:bg-surface-hover",
                                            currency === 'IDR' ? "border-primary bg-primary/5" : "border-border bg-transparent"
                                        )}
                                    >
                                        <span className="font-bold text-xl">Rp</span>
                                        <span className="text-sm font-medium">IDR</span>
                                    </button>
                                    <button
                                        onClick={() => setCurrency('USD')}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 transition-all hover:bg-surface-hover",
                                            currency === 'USD' ? "border-primary bg-primary/5" : "border-border bg-transparent"
                                        )}
                                    >
                                        <span className="font-bold text-xl">$</span>
                                        <span className="text-sm font-medium">USD</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-6">
                            {t('settings.currency_note')}
                        </p>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Monitor className="h-5 w-5 text-primary" />
                            <h2 className="font-bold text-lg">{t('settings.appearance_title')}</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{t('settings.appearance_desc')}</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-2">
                            <Label>{t('settings.theme_label')}</Label>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 h-24 w-32 rounded-xl border-2 transition-all hover:bg-surface-hover",
                                        theme === 'light' ? "border-primary bg-primary/5" : "border-border bg-transparent"
                                    )}
                                >
                                    <Sun className="h-6 w-6" />
                                    <span className="text-sm font-medium">Light</span>
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 h-24 w-32 rounded-xl border-2 transition-all hover:bg-surface-hover",
                                        theme === 'dark' ? "border-primary bg-primary/5" : "border-border bg-transparent"
                                    )}
                                >
                                    <Moon className="h-6 w-6" />
                                    <span className="text-sm font-medium">Dark</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications & Security (Placeholders) */}
                <div className="grid gap-8 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4 opacity-50 pointer-events-none">
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            <h3 className="font-bold">{t('settings.notifications_title')}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{t('settings.notifications_desc')}</p>
                        <Button variant="outline" size="sm" disabled>{t('settings.manage_notifications')}</Button>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4 opacity-50 pointer-events-none">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <h3 className="font-bold">{t('settings.security_title')}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{t('settings.security_desc')}</p>
                        <Button variant="outline" size="sm" disabled>{t('settings.update_password')}</Button>
                    </div>
                </div>

                {/* Account Actions */}
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 shadow-sm overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-lg text-destructive flex items-center gap-2">
                                <LogOut className="h-5 w-5" />
                                {t('settings.sign_out_title')}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">{t('settings.sign_out_desc')}</p>
                        </div>
                        <Button variant="destructive" onClick={logout}>{t('settings.sign_out_btn')}</Button>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
                    <HelpCircle className="h-4 w-4" />
                    <span>{t('settings.version')}</span>

                </div>

            </div>
        </DashboardLayout >
    );
}
