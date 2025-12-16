import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Moon, Sun, Monitor, LogOut, Shield, Bell, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const { user, logout } = useAuthStore();
    const { theme, setTheme } = useTheme();

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8 pb-10">
                <div>
                    <h1 className="text-3xl font-display font-bold">Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your account preferences and application settings.</p>
                </div>

                {/* Profile Section */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <h2 className="font-bold text-lg">Profile Information</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Update your account's profile information and email address.</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" defaultValue={user?.name} disabled />
                                <p className="text-[0.8rem] text-muted-foreground">Name can only be changed by contacting support.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" defaultValue={user?.email} disabled />
                                <p className="text-[0.8rem] text-muted-foreground">Your email address is your identity on Mankeu.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Monitor className="h-5 w-5 text-primary" />
                            <h2 className="font-bold text-lg">Appearance</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Customize the interface of the application.</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-2">
                            <Label>Theme</Label>
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
                            <h3 className="font-bold">Notifications</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">Manage how you receive notifications.</p>
                        <Button variant="outline" size="sm" disabled>Manage Notifications</Button>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4 opacity-50 pointer-events-none">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <h3 className="font-bold">Security</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">Manage password and security settings.</p>
                        <Button variant="outline" size="sm" disabled>Update Password</Button>
                    </div>
                </div>

                {/* Account Actions */}
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 shadow-sm overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-lg text-destructive flex items-center gap-2">
                                <LogOut className="h-5 w-5" />
                                Sign Out
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">Sign out of your account on this device.</p>
                        </div>
                        <Button variant="destructive" onClick={logout}>Sign Out</Button>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
                    <HelpCircle className="h-4 w-4" />
                    <span>Mankeu v1.0.0</span>
                    <span>•</span>
                    <a href="#" className="hover:underline">Privacy Policy</a>
                    <span>•</span>
                    <a href="#" className="hover:underline">Terms of Service</a>
                </div>

            </div>
        </DashboardLayout>
    );
}
