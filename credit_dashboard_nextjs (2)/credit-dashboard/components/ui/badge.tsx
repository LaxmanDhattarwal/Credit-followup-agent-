import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-zinc-800 text-zinc-200",
        secondary:   "border-transparent bg-zinc-700 text-zinc-300",
        destructive: "border-transparent bg-red-900/50 text-red-400",
        outline:     "text-zinc-400 border-zinc-700",
        amber:       "border-amber-800/40 bg-amber-950/40 text-amber-300",
        success:     "border-green-800/40 bg-green-950/40 text-green-400",
        purple:      "border-purple-800/40 bg-purple-950/40 text-purple-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
