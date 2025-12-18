import React, { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    disabled?: boolean;
}

export function PullToRefresh({ onRefresh, children, disabled }: PullToRefreshProps) {
    const [startY, setStartY] = useState<number | null>(null);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // We need to track if we started the touch at the VERY TOP of the page
    const startScrollY = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (disabled || isRefreshing) return;

        startScrollY.current = window.scrollY;

        // Only enable if we are at the top of the scroll
        if (window.scrollY > 0) return;

        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY === null || disabled || isRefreshing) return;

        // If we scrolled down during the move, cancel pull
        if (window.scrollY > 0) {
            setStartY(null);
            setPullDistance(0);
            return;
        }

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) {
            // Resistive pull
            // We want maximum drag to be around 150px
            const resistance = 0.4;
            setPullDistance(Math.min(diff * resistance, 150));

            // Prevent default scrolling if we are pulling down
            if (e.cancelable && diff > 5) {
                // e.preventDefault(); // React synthetic events might not support this directly in all cases cleanly without passive: false
            }
        } else {
            setPullDistance(0);
        }
    };

    const handleTouchEnd = async () => {
        if (startY === null || disabled || isRefreshing) return;

        if (pullDistance > 60) {
            setIsRefreshing(true);
            setPullDistance(60); // Snap to loading position

            // Haptic trigger could act here too if passed
            if (navigator.vibrate) navigator.vibrate(10);

            try {
                await onRefresh();
            } finally {
                // Wait a bit to show success state
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullDistance(0);
                }, 500);
            }
        } else {
            setPullDistance(0);
        }
        setStartY(null);
    };

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex flex-col min-h-full"
        >
            <div
                className={cn(
                    "flex items-center justify-center overflow-hidden w-full transition-all duration-300 ease-out",
                    isRefreshing || pullDistance > 0 ? "opacity-100" : "opacity-0"
                )}
                style={{
                    height: pullDistance,
                    marginTop: pullDistance > 0 ? -10 : 0, // Slight overlap fix
                    marginBottom: 10
                }}
            >
                <RefreshCw
                    className={cn("w-6 h-6 text-primary")}
                    style={{
                        transform: `rotate(${pullDistance * 3}deg)`,
                        animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                    }}
                />
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
