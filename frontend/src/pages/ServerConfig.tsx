import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { updateApiBaseUrl } from "@/lib/axios";
import { Preferences } from '@capacitor/preferences';
import { checkBackendConnection } from "@/services/health";
import { Server, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ServerConfig() {
    const { t } = useTranslation();
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUrl = async () => {
            const { value: savedUrl } = await Preferences.get({ key: 'api_url' });
            const currentUrl = savedUrl || import.meta.env.VITE_API_URL || "https://mankeu-backend.vercel.app/api/v1";
            setUrl(currentUrl);
        };
        loadUrl();
    }, []);

    const handleConnect = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await checkBackendConnection(url);
            await updateApiBaseUrl(url);

            setSuccess(true);
            setTimeout(() => {
                navigate("/login");
            }, 1000);
        } catch (err) {
            console.error(err);
            setError(t('server_config.error_failed'));
            setSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 transition-colors duration-300">
            {/* Header / Logo Area */}
            <div className="mb-6 text-center">
                <div className="mx-auto bg-primary/10 w-16 h-16 rounded-3xl flex items-center justify-center shadow-sm mb-4">
                    <Server className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-display font-bold text-foreground">{t('server_config.header_title')}</h1>
                <p className="text-muted-foreground mt-2 text-sm">{t('server_config.header_desc')}</p>
            </div>

            <Card className="w-full max-w-[400px] border-none shadow-none rounded-3xl overflow-hidden">
                <CardContent className="space-y-6 pt-2">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="url" className="text-sm font-semibold text-muted-foreground ml-1">
                                {t('server_config.url_label')}
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <span className="text-muted-foreground/50 text-lg">🌐</span>
                                </div>
                                <Input
                                    id="url"
                                    placeholder=""
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    disabled={loading || success}
                                    className="h-14 pl-10 rounded-2xl border-2 border-border/60 bg-muted/30 text-base transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                                />
                            </div>
                            <p className="text-[11px] sm:text-xs text-muted-foreground px-2 leading-relaxed">
                                {t('server_config.url_tip')}
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
                                <span className="font-semibold">{t('server_config.success_connected')}</span>
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
                                <span>{t('server_config.connecting_button')}</span>
                            </div>
                        ) : t('server_config.connect_button')}
                    </Button>
                </CardFooter>
            </Card>

            {/* Footer Help */}
            <p className="mt-8 text-center text-xs text-muted-foreground/60 sm:hidden">
                {t('server_config.help_footer')}
            </p>
        </div>
    );
}
