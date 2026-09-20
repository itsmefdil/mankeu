import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
    <ProgressPrimitive.Root
        ref={ref}
        className={cn(
            "relative h-4 w-full overflow-hidden rounded-full bg-background shadow-neu-inset-sm dark:shadow-neu-dark-inset-sm p-0.5",
            className
        )}
        {...props}
    >
        <ProgressPrimitive.Indicator
            className="h-full rounded-full bg-primary transition-all duration-500 shadow-neu-extruded-sm"
            style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }}
        />
    </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
