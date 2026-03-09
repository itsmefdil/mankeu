import { useEffect, useState } from 'react';
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
import {
    applyReminderSettings,
    DEFAULT_REMINDER_SETTINGS,
    loadReminderSettings,
    sendTestNotification,
} from '@/services/notifications';

export default function SettingsPage() {
    const { user, logout } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const { currency, language, setCurrency, setLanguage } = usePreferencesStore();
    const { t } = useTranslation();
    const [reminderSettings, setReminderSettings] = useState(DEFAULT_REMINDER_SETTINGS);
    const [isLoadingReminder, setIsLoadingReminder] = useState(true);
    const [isSavingReminder, setIsSavingReminder] = useState(false);
    const [isTestingReminder, setIsTestingReminder] = useState(false);
    const [reminderStatus, setReminderStatus] = useState('');

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await loadReminderSettings();
            setReminderSettings(settings);
            setIsLoadingReminder(false);
        };

        loadSettings();
    }, []);

    const handleSaveReminder = async () => {
        setIsSavingReminder(true);

        const result = await applyReminderSettings(
            reminderSettings,
            t('settings.reminder_notification_title'),
            t('settings.reminder_notification_body')
        );

        if (!result.isNative) {
            setReminderStatus(t('settings.reminder_native_only'));
        } else if (reminderSettings.enabled && !result.granted) {
            setReminderStatus(t('settings.reminder_permission_denied'));
        } else if (reminderSettings.enabled) {
            setReminderStatus(t('settings.reminder_saved'));
        } else {
            setReminderStatus(t('settings.reminder_disabled'));
        }

        setIsSavingReminder(false);
    };

    const handleTestReminder = async () => {
        setIsTestingReminder(true);

        const result = await sendTestNotification(
            t('settings.reminder_test_notification_title'),
            t('settings.reminder_test_notification_body')
        );

        if (!result.isNative) {
            setReminderStatus(t('settings.reminder_native_only'));
        } else if (!result.granted) {
            setReminderStatus(t('settings.reminder_permission_denied'));
        } else {
            setReminderStatus(t('settings.reminder_test_sent'));
        }

        setIsTestingReminder(false);
    };

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

                {/* Notifications & Security */}
                <div className="grid gap-8 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            <h3 className="font-bold">{t('settings.notifications_title')}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{t('settings.notifications_desc')}</p>

                        <div className="space-y-3 rounded-xl border border-border p-4">
                            <div className="flex items-center justify-between gap-3">
                                <Label>{t('settings.reminder_enable')}</Label>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={reminderSettings.enabled ? 'default' : 'outline'}
                                    onClick={() => setReminderSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
                                    disabled={isLoadingReminder}
                                >
                                    {reminderSettings.enabled ? t('settings.reminder_on') : t('settings.reminder_off')}
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reminder-time">{t('settings.reminder_time')}</Label>
                                <Input
                                    id="reminder-time"
                                    type="time"
                                    value={reminderSettings.time}
                                    onChange={(e) => setReminderSettings((prev) => ({ ...prev, time: e.target.value }))}
                                    disabled={isLoadingReminder || !reminderSettings.enabled}
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleSaveReminder}
                                    disabled={isLoadingReminder || isSavingReminder || isTestingReminder}
                                >
                                    {isSavingReminder ? t('settings.reminder_saving') : t('settings.reminder_save')}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={handleTestReminder}
                                    disabled={isLoadingReminder || isSavingReminder || isTestingReminder}
                                >
                                    {isTestingReminder ? t('settings.reminder_testing') : t('settings.reminder_test')}
                                </Button>
                            </div>

                            {reminderStatus && (
                                <p className="text-xs text-muted-foreground">{reminderStatus}</p>
                            )}
                        </div>
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
