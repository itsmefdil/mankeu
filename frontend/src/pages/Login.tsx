import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Lock, Wallet, ArrowRight, TrendingUp, PieChart, ShieldCheck } from 'lucide-react';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);

    useEffect(() => {
        console.log("Initializing Google Auth with Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
        GoogleAuth.initialize({
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            scopes: ['profile', 'email'],
            grantOfflineAccess: false,
        });
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
                const message = err.response?.data?.detail || 'Google Login failed';
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
            const message = err.response?.data?.detail || 'Invalid email or password';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-background">
            {/* Left Side - Visual Showcase (Desktop Only) */}
            <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-muted/30 p-12 flex-col justify-between">
                {/* Background Blobs */}
                <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

                {/* Brand Top Left */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <Wallet className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="text-2xl font-display font-bold text-foreground tracking-tight">Mankeu</span>
                </div>

                {/* Main Visual - Floating Cards */}
                <div className="relative z-10 flex-1 flex items-center justify-center perspective-[1000px]">
                    <div className="relative w-[480px] h-[320px]">
                        {/* Card 1: Main Balance (Center) */}
                        <div className="absolute inset-0 z-20 transform hover:scale-105 transition-all duration-500">
                            <div className="w-full h-full rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 shadow-2xl border border-white/10 flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors" />

                                <div className="flex justify-start">
                                    <div className="w-12 h-8 rounded ml-auto flex gap-1">
                                        <div className="w-8 h-8 rounded-full bg-white/20 blur-sm absolute top-8 right-8" />
                                        <div className="w-8 h-8 rounded-full bg-primary/20 blur-sm absolute top-8 right-12" />
                                    </div>
                                    <p className="text-gray-400 font-medium tracking-wide">Total Balance</p>
                                </div>

                                <div>
                                    <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Rp 124.500.000</h2>
                                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-500/10 w-fit px-3 py-1 rounded-full border border-emerald-500/20">
                                        <TrendingUp className="w-4 h-4" />
                                        <span>+12.5% this month</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider">Card Holder</div>
                                        <div className="text-white font-medium">Noma Antigravity</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="h-8 w-12 bg-white/10 rounded mb-1" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Income (Floats Right Top) */}
                        <div className="absolute -top-12 -right-24 z-10 animate-float" style={{ animationDelay: '0s' }}>
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xl border border-border/50 w-64 backdrop-blur-md bg-opacity-90">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium">Income</p>
                                        <p className="text-lg font-bold text-foreground">Rp 8.250.000</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Spending (Floats Left Bottom) */}
                        <div className="absolute -bottom-16 -left-16 z-30 animate-float" style={{ animationDelay: '1.5s' }}>
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xl border border-border/50 w-64 backdrop-blur-md bg-opacity-90">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                        <PieChart className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium">Monthly Spending</p>
                                        <p className="text-lg font-bold text-foreground">Rp 3.400.000</p>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                    <div className="bg-orange-500 h-full rounded-full" style={{ width: '45%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quote / Text */}
                <div className="relative z-10 max-w-md">
                    <p className="text-xl font-medium text-foreground leading-relaxed">
                        "Mankeu helps me track every rupiah with ease. The visual components make financial planning actually fun."
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-background bg-gray-200 dark:bg-gray-700`} />
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground ml-2">Trusted by 10,000+ users</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-2/5 flex flex-col justify-center px-6 sm:px-12 xl:px-24 py-12 bg-background relative selection:bg-primary/20">
                {/* Mobile Header */}
                <div className="lg:hidden mb-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 text-primary">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-foreground">Mankeu</h1>
                </div>

                <div className="w-full max-w-sm mx-auto space-y-8">
                    <div className="text-center lg:text-left">
                        <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">Welcome back</h1>
                        <p className="mt-3 text-muted-foreground">
                            Enter your credentials to access your finance dashboard.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                                    Email
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-12 bg-muted/30 border-border/60 focus:border-primary focus:bg-background transition-all rounded-xl"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                        Password
                                    </label>
                                    {/* <Link to="#" className="text-xs font-medium text-primary hover:underline">
                                        Forgot password?
                                    </Link> */}
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 h-12 bg-muted/30 border-border/60 focus:border-primary focus:bg-background transition-all rounded-xl"
                                        required
                                        autoComplete="current-password"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <span className="font-medium text-destructive">{error}</span>
                            </div>
                        )}

                        <Button
                            className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-emerald-600 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                                <span className="flex items-center justify-center gap-2">
                                    Sign In <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>

                        {/* Server Config Link */}
                        <div className="flex justify-center">
                            <Link
                                to="/server-config"
                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted/50"
                            >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Secure Server Check
                            </Link>
                        </div>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full h-12 font-semibold rounded-xl border-2 border-border/50 hover:bg-muted/50 hover:text-foreground hover:border-border transition-all"
                        disabled={loading}
                    >
                        <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        Sign in with Google
                    </Button>

                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">Don't have an account? </span>
                        <Link to="/register" className="font-bold text-primary hover:underline underline-offset-4">
                            Sign up for free
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
