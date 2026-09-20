import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const register = useAuthStore((state) => state.register);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await register(name, email, password);
            // Redirect to login or auto-login
            navigate('/login');
        } catch (err: any) {
            const message = err.response?.data?.detail || t('auth.registration_failed');
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 transition-colors duration-300">
            {/* Header / Logo Area */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-display font-bold text-primary">Mankeu</h1>
                <p className="text-muted-foreground mt-2 text-sm">{t('auth.join_today')}</p>
            </div>

            <div className="w-full max-w-[400px] border-none shadow-none rounded-3xl overflow-hidden p-0">


                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-semibold text-muted-foreground ml-1">{t('auth.full_name')}</label>
                            <Input
                                id="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-14 px-4 rounded-2xl border-2 border-border/60 bg-muted/30 text-base transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                                placeholder={t('auth.full_name_placeholder')}
                                autoComplete="name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-semibold text-muted-foreground ml-1">{t('auth.email')}</label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-14 px-4 rounded-2xl border-2 border-border/60 bg-muted/30 text-base transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                                placeholder={t('auth.email_placeholder')}
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-semibold text-muted-foreground ml-1">{t('auth.password')}</label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-14 px-4 rounded-2xl border-2 border-border/60 bg-muted/30 text-base transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border border-destructive/20">
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98]"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : t('auth.create_account')}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        {t('auth.already_have_account')}{' '}
                        <Link to="/login" className="font-bold text-primary hover:underline">
                            {t('auth.login_here')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
