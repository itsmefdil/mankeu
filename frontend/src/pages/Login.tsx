import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming this exists or I'll create it
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

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
        <div className="min-h-screen flex flex-col items-center justify-center bg-background sm:bg-gray-50/50 p-4 sm:px-6 lg:px-8 transition-colors duration-300">
            {/* Header / Logo Area for Mobile */}
            <div className="mb-8 text-center sm:hidden">
                <h1 className="text-3xl font-display font-bold text-primary">Mankeu</h1>
                <p className="text-muted-foreground mt-2 text-sm">Your personal finance companion</p>
            </div>

            <div className="w-full max-w-[400px] border-none shadow-none sm:border sm:border-border/60 sm:shadow-xl sm:shadow-primary/5 sm:bg-white/80 sm:backdrop-blur-xl rounded-3xl overflow-hidden p-0 sm:p-8">
                <div className="text-center mb-8 hidden sm:block">
                    <h1 className="text-3xl font-display font-bold text-foreground">Welcome Back</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Sign in to your Mankeu account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-semibold text-muted-foreground ml-1">Email</label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                className="h-14 px-4 rounded-2xl border-2 border-border/60 bg-muted/30 text-base transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                                placeholder="hello@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-semibold text-muted-foreground ml-1">Password</label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                className="h-14 px-4 rounded-2xl border-2 border-border/60 bg-muted/30 text-base transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                                placeholder="••••••••"
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
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Sign In'}
                    </Button>
                </form>

                <div className="mt-8 space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-bold text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/60" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background sm:bg-white px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>

                    <Link
                        to="/server-config"
                        className="inline-flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                    >
                        <span>Change Server</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
