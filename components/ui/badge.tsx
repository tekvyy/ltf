import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary text-primary-foreground",
        secondary:
          "border border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border border-destructive/20 bg-destructive/10 text-destructive",
        outline: "border border-border text-foreground",
        success:
          "border border-emerald-600/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
        warning:
          "border border-amber-500/25 bg-amber-400/15 text-amber-700 dark:text-amber-400",
        info:
          "border border-sky-500/20 bg-sky-500/12 text-sky-700 dark:text-sky-400",
        gray:
          "border border-border bg-muted text-muted-foreground",
        brand:
          "border border-primary/20 bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
