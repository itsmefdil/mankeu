import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    deep?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, deep = false, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-11 w-full rounded-2xl bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300",
                    deep
                        ? "shadow-neu-inset-deep dark:shadow-neu-dark-inset-deep"
                        : "shadow-neu-inset dark:shadow-neu-dark-inset",
                    "focus:shadow-neu-inset-deep dark:focus:shadow-neu-dark-inset-deep focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
