import { Loader2 } from 'lucide-react';

export const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
            <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
                {/* Logo Area */}
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse-glow" />
                    <img
                        src="/logo.svg"
                        alt="Mankeu"
                        className="w-24 h-24 relative z-10 animate-float"
                    />
                </div>

                {/* Text & Spinner */}
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-teal-500 tracking-tight">
                        Mankeu
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Initializing...</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 text-center text-xs text-muted-foreground/50">
                <p>Secure Financial Management</p>
            </div>
        </div>
    );
};
