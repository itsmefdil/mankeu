import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
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
            const message = err.response?.data?.detail || 'Registration failed. Please try again.';
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
                <p className="text-muted-foreground mt-2 text-sm">Join us today</p>
            </div>

            <div className="w-full max-w-[400px] border-none shadow-none sm:border sm:border-border/60 sm:shadow-xl sm:shadow-primary/5 sm:bg-white/80 sm:backdrop-blur-xl rounded-3xl overflow-hidden p-0 sm:p-8">
                <div className="text-center mb-8 hidden sm:block">
                    <h1 className="text-3xl font-display font-bold text-foreground">Create Account</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Start managing your finances today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-semibold text-muted-foreground ml-1">Full Name</label>
                            <Input
                                id="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-14 px-4 rounded-2xl border-2 border-border/60 bg-muted/30 text-base transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                                placeholder="John Doe"
                                autoComplete="name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-semibold text-muted-foreground ml-1">Email</label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-14 px-4 rounded-2xl border-2 border-border/60 bg-muted/30 text-base transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                                placeholder="hello@example.com"
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-semibold text-muted-foreground ml-1">Password</label>
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
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Create Account'}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
