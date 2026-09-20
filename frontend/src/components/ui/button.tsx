import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-neu-extruded-sm hover:shadow-neu-extruded-hover hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-neu-inset-sm dark:shadow-none dark:hover:shadow-none",
                secondary:
                    "bg-background text-foreground shadow-neu-extruded-sm hover:shadow-neu-extruded-hover hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-neu-inset",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-neu-extruded-sm hover:shadow-neu-extruded-hover hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-neu-inset-sm dark:shadow-none dark:hover:shadow-none",
                outline:
                    "bg-background text-foreground shadow-neu-extruded-sm hover:text-primary active:shadow-neu-inset",
                ghost:
                    "hover:bg-background/80 hover:shadow-neu-inset-sm text-foreground",
                inset:
                    "bg-background text-primary shadow-neu-inset active:shadow-neu-inset-deep",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-11 px-5 py-2.5",
                sm: "h-9 rounded-xl px-3.5 text-xs",
                lg: "h-12 rounded-2xl px-8 text-base",
                icon: "h-11 w-11 rounded-2xl",
                "icon-sm": "h-9 w-9 rounded-xl",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
