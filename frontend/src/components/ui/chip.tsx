import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const chipVariants = cva(
    "inline-flex items-center gap-1.5 font-medium rounded-2xl transition-all duration-300 cursor-pointer select-none active:translate-y-0.5",
    {
        variants: {
            variant: {
                assist:
                    "bg-background text-foreground shadow-neu-extruded-sm dark:shadow-neu-dark-extruded-sm hover:shadow-neu-extruded-hover dark:hover:shadow-neu-dark-extruded-hover",
                filter:
                    "bg-background text-foreground shadow-neu-extruded-sm dark:shadow-neu-dark-extruded-sm hover:shadow-neu-extruded-hover data-[selected=true]:shadow-neu-inset data-[selected=true]:text-primary data-[selected=true]:dark:shadow-neu-dark-inset",
                input:
                    "bg-background text-foreground shadow-neu-inset-sm dark:shadow-neu-dark-inset-sm",
                tonal:
                    "bg-background text-primary shadow-neu-inset-sm dark:shadow-neu-dark-inset-sm font-semibold",
                elevated:
                    "bg-background text-foreground shadow-neu-extruded dark:shadow-neu-dark-extruded hover:shadow-neu-extruded-hover",
            },
            size: {
                sm: "h-8 px-3 text-xs",
                default: "h-10 px-4 text-xs sm:text-sm",
                lg: "h-12 px-5 text-sm",
            },
        },
        defaultVariants: {
            variant: "assist",
            size: "default",
        },
    }
)

export interface ChipProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
    selected?: boolean
    onRemove?: () => void
    icon?: React.ReactNode
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
    ({ className, variant, size, selected, onRemove, icon, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                data-selected={selected}
                className={cn(chipVariants({ variant, size, className }))}
                {...props}
            >
                {icon && <span className="shrink-0">{icon}</span>}
                <span>{children}</span>
                {onRemove && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemove()
                        }}
                        className="ml-1 rounded-full p-1 hover:bg-foreground/10 transition-colors"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
        )
    }
)
Chip.displayName = "Chip"

export { Chip, chipVariants }
