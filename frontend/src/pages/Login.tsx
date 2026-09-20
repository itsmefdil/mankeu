import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Lock, Wallet, ArrowRight, ShieldCheck } from 'lucide-react';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { GoogleLogin } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            GoogleAuth.initialize({
                clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                scopes: ['profile', 'email'],
                grantOfflineAccess: false,
            });
        }
    }, []);

    const handleGoogleLogin = async () => {
        try {
            const googleUser = await GoogleAuth.signIn();
            setLoading(true);
            setError('');
            await loginWithGoogle(googleUser.authentication.idToken);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            // Don't show error if user cancelled
            if (err?.error !== 'User cancelled login') {
                const message = err.response?.data?.detail || t('auth.google_login_failed');
                setError(message);
            }
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            const message = err.response?.data?.detail || t('auth.invalid_credentials');
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col justify-center px-6 py-10 bg-background relative selection:bg-primary/20">
            {/* Brand Header */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-background shadow-neu-extruded-sm mb-3 text-primary">
                    <Wallet className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-display font-black tracking-tight text-foreground">Mankeu</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">{t('nav.finance')}</p>
            </div>

            <div className="w-full max-w-sm mx-auto space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-display font-bold text-foreground tracking-tight">{t('auth.welcome_back')}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('auth.sign_in_subtitle')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground ml-1" htmlFor="email">
                                {t('auth.email')}
                            </label>
                            <div className="relative group">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={t('auth.email_placeholder')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-12 bg-background shadow-neu-inset dark:shadow-neu-dark-inset border-none rounded-2xl text-sm"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground ml-1" htmlFor="password">
                                {t('auth.password')}
                            </label>
                            <div className="relative group">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 h-12 bg-background shadow-neu-inset dark:shadow-neu-dark-inset border-none rounded-2xl text-sm"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3.5 rounded-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
                            <span className="font-medium text-xs text-destructive">{error}</span>
                        </div>
                    )}

                    <Button
                        className="w-full h-12 text-base font-semibold rounded-2xl neu-btn-primary"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                            <span className="flex items-center justify-center gap-2">
                                {t('auth.sign_in')} <ArrowRight className="w-4 h-4" />
                            </span>
                        )}
                    </Button>

                    {/* Server Config Link */}
                    <div className="flex justify-center pt-1">
                        <Link
                            to="/server-config"
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted/50"
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {t('server_config.card_title')}
                        </Link>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground font-semibold">{t('auth.or')}</span>
                    </div>
                </div>

                {Capacitor.isNativePlatform() ? (
                    <Button
                        variant="outline"
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full h-12 font-semibold rounded-2xl bg-background shadow-neu-extruded-sm hover:shadow-neu-extruded-hover active:shadow-neu-inset-sm border-none"
                        disabled={loading}
                    >
                        <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        {t('auth.continue_google')}
                    </Button>
                ) : (
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                                if (credentialResponse.credential) {
                                    setLoading(true);
                                    try {
                                        await loginWithGoogle(credentialResponse.credential);
                                        navigate('/');
                                    } catch (err: any) {
                                        const message = err.response?.data?.detail || t('auth.google_login_failed');
                                        setError(message);
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            }}
                            onError={() => {
                                setError(t('auth.google_login_failed'));
                            }}
                            useOneTap
                            theme="outline"
                            size="large"
                            width="340"
                            shape="pill"
                        />
                    </div>
                )}

                <div className="text-center text-sm pt-2">
                    <span className="text-muted-foreground">{t('auth.no_account')}{' '}</span>
                    <Link to="/register" className="font-bold text-primary hover:underline underline-offset-4">
                        {t('auth.register_here')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
