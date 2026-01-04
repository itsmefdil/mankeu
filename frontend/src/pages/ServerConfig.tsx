import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { updateApiBaseUrl } from "@/lib/axios";
import { Preferences } from '@capacitor/preferences';
import { checkBackendConnection } from "@/services/health";
import { Server, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ServerConfig() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUrl = async () => {
            const { value: savedUrl } = await Preferences.get({ key: 'api_url' });
            const currentUrl = savedUrl || import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
            setUrl(currentUrl);
        };
        loadUrl();
    }, []);

    const handleConnect = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Temporarily update URL to test connection
            updateApiBaseUrl(url);

            // Simple health check or ping
            await checkBackendConnection();

            setSuccess(true);
            setTimeout(() => {
                navigate("/login");
            }, 1000);
        } catch (err) {
            console.error(err);
            setError("Failed to connect to the server. Please check the URL and try again.");
            setSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:px-6 lg:px-8 transition-colors duration-300">
            {/* Header / Logo Area */}
            <div className="mb-8 text-center sm:hidden">
                <div className="mx-auto bg-primary/10 w-16 h-16 rounded-3xl flex items-center justify-center shadow-sm mb-4">
                    <Server className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-display font-bold text-foreground">Setup Server</h1>
                <p className="text-muted-foreground mt-2 text-sm">Connect to your personal Mankeu cloud</p>
            </div>

            <Card className="w-full max-w-[400px] border-none shadow-none sm:border sm:border-border/60 sm:shadow-xl sm:shadow-primary/5 sm:bg-card sm:backdrop-blur-xl rounded-3xl overflow-hidden">
                <CardHeader className="text-center pb-2 hidden sm:block">
                    <div className="mx-auto mb-6 bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner transform hover:scale-105 transition-transform duration-300">
                        <Server className="w-10 h-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold font-display text-foreground">Server Setup</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Connect to your Mankeu backend
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-2 sm:pt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="url" className="text-sm font-semibold text-muted-foreground ml-1">
                                Server URL
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <span className="text-muted-foreground/50 text-lg">🌐</span>
                                </div>
                                <Input
                                    id="url"
                                    placeholder="e.g. http://192.168.1.5:8000"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    disabled={loading || success}
                                    className="h-14 pl-10 rounded-2xl border-2 border-border/60 bg-muted/30 text-base transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                                />
                            </div>
                            <p className="text-[11px] sm:text-xs text-muted-foreground px-2 leading-relaxed">
                                Tip: Use your computer's local IP address (e.g. 192.168.x.x) if running on the same Wi-Fi.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 border border-destructive/20">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <span className="leading-tight font-medium">{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border border-emerald-500/20">
                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                                <span className="font-semibold">Connected! Redirecting...</span>
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="pb-8 pt-2">
                    <Button
                        className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98]"
                        onClick={handleConnect}
                        disabled={loading || success}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Connecting...</span>
                            </div>
                        ) : "Connect to Server"}
                    </Button>
                </CardFooter>
            </Card>

            {/* Footer Help */}
            <p className="mt-8 text-center text-xs text-muted-foreground/60 sm:hidden">
                Need help finding your IP? Check network settings.
            </p>
        </div>
    );
}
