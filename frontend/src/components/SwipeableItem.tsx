import React, { useState, useRef } from 'react';
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

interface SwipeableItemProps {
    children: React.ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    leftContent?: React.ReactNode;
    rightContent?: React.ReactNode;
    className?: string;
    vibrate?: () => void;
}

export function SwipeableItem({ children, onSwipeLeft, onSwipeRight, leftContent, rightContent, className, vibrate }: SwipeableItemProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [offsetX, setOffsetX] = useState(0);
    const startX = useRef<number | null>(null);
    const currentX = useRef<number>(0);
    const isSwiping = useRef(false);
    const triggered = useRef(false);

    // If desktop, just render children without swipe logic
    if (isDesktop) {
        return <div className={className}>{children}</div>;
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        isSwiping.current = true;
        triggered.current = false;
        setOffsetX(0);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping.current || startX.current === null) return;
        const x = e.touches[0].clientX;
        const diff = x - startX.current;

        // Only consider horizontal swipes
        // But we rely on touch-pan-y CSS to let browser handle vertical scroll

        // Limit swipe distance for visual feedback
        const limit = 120;
        let newX = diff;

        if (newX > limit) newX = limit + (newX - limit) * 0.2;
        if (newX < -limit) newX = -limit + (newX + limit) * 0.2;

        currentX.current = newX;
        setOffsetX(newX);

        // Haptic feedback when crossing threshold
        if (!triggered.current) {
            if (newX > 80 && onSwipeRight) {
                if (vibrate) vibrate();
                triggered.current = true;
            } else if (newX < -80 && onSwipeLeft) {
                if (vibrate) vibrate();
                triggered.current = true;
            }
        } else {
            // Reset trigger if user goes back
            if (Math.abs(newX) < 70) {
                triggered.current = false;
            }
        }
    };

    const handleTouchEnd = () => {
        isSwiping.current = false;
        startX.current = null;

        const threshold = 80;

        if (currentX.current > threshold && onSwipeRight) {
            onSwipeRight();
            // Animate out or bounce back? usually we bounce back unless it's a dismiss
            // For edit/delete, let's bounce back after action
        } else if (currentX.current < -threshold && onSwipeLeft) {
            onSwipeLeft();
        }

        setOffsetX(0);
        currentX.current = 0;
        triggered.current = false;
    };

    return (
        <div
            className="relative overflow-hidden touch-pan-y select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Background Actions */}
            <div className="absolute inset-0 flex items-center justify-between">
                <div
                    className={cn(
                        "flex items-center justify-start pl-6 h-full w-1/2 transition-opacity duration-200",
                        offsetX > 20 ? "opacity-100" : "opacity-0"
                    )}
                    style={{ backgroundColor: offsetX > 0 ? 'rgba(16, 185, 129, 0.1)' : 'transparent' }} // Emerald 500/10
                >
                    <div className={cn("transform transition-transform duration-200", offsetX > 80 ? "scale-125" : "scale-100")}>
                        {rightContent}
                    </div>
                </div>
                <div
                    className={cn(
                        "flex items-center justify-end pr-6 h-full w-1/2 transition-opacity duration-200",
                        offsetX < -20 ? "opacity-100" : "opacity-0"
                    )}
                    style={{ backgroundColor: offsetX < 0 ? 'rgba(244, 63, 94, 0.1)' : 'transparent' }} // Rose 500/10
                >
                    <div className={cn("transform transition-transform duration-200", offsetX < -80 ? "scale-125" : "scale-100")}>
                        {leftContent}
                    </div>
                </div>
            </div>

            {/* Foreground Content */}
            <div
                className={cn(className, "relative transition-transform duration-200 ease-out bg-background")}
                style={{ transform: `translateX(${offsetX}px)` }}
            >
                {children}
            </div>
        </div>
    );
}
