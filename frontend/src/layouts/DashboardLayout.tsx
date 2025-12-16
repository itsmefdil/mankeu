import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex min-h-screen w-full bg-background text-foreground font-sans selection:bg-primary/20">
            <Sidebar />
            <BottomNav />
            <div className="flex flex-col flex-1 pl-0 md:pl-64 transition-all duration-300 pb-16 md:pb-0">
                <TopBar />
                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
};
