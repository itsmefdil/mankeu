import React from 'react';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
    children: React.ReactNode;
    hideBottomNav?: boolean;
}

export const DashboardLayout = ({ children, hideBottomNav = false }: DashboardLayoutProps) => {
    const isKeyboardVisible = useKeyboardVisible();
    const shouldHideNav = hideBottomNav || isKeyboardVisible;

    return (
        <div className="flex min-h-screen w-full bg-background text-foreground font-sans selection:bg-primary/20">
            {!shouldHideNav && <BottomNav />}
            <div className={cn(
                "flex flex-col flex-1 h-screen overflow-hidden transition-all duration-200",
                shouldHideNav ? "pb-0" : "pb-16"
            )}>
                <TopBar />
                <main className="flex-1 p-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto overscroll-y-contain custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
};

