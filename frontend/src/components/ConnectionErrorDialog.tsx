import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useConnectionStore } from "@/hooks/useConnectionStore";
import { WifiOff, Server } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export function ConnectionErrorDialog() {
    const { isConnectionError, setConnectionError } = useConnectionStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show the dialog if we are already on the server config page
    if (location.pathname === '/server-config') {
        return null;
    }

    const handleRetry = () => {
        setConnectionError(false);
        window.location.reload();
    };

    const handleChangeServer = () => {
        setConnectionError(false);
        navigate("/server-config");
    };

    return (
        <AlertDialog open={isConnectionError}>
            <AlertDialogContent className="max-w-[360px] rounded-3xl border-0 shadow-2xl bg-card">
                <AlertDialogHeader className="items-center text-center space-y-4 pt-4">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                        <WifiOff className="w-8 h-8 text-destructive" />
                    </div>
                    <AlertDialogTitle className="text-xl font-display font-bold">
                        Connection Lost
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground text-center">
                        Unable to connect to the Mankeu server. The server might be down or your internet connection is unstable.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col gap-2 mt-4 sm:flex-col sm:space-x-0 w-full">
                    <Button
                        className="w-full h-12 rounded-xl text-base font-semibold"
                        onClick={handleRetry}
                    >
                        Retry Connection
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl text-base font-medium border-border/50 bg-secondary/30 hover:bg-secondary/50"
                        onClick={handleChangeServer}
                    >
                        <Server className="w-4 h-4 mr-2" />
                        Change Server
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
