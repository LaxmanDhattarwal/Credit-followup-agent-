import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:          "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700",
        destructive:      "bg-red-900/50 text-red-400 hover:bg-red-900/80 border border-red-800/40",
        outline:          "border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300",
        secondary:        "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
        ghost:            "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300",
        link:             "text-amber-400 underline-offset-4 hover:underline",
        amber:            "bg-amber-500 text-black hover:bg-amber-400 font-semibold",
        "amber-outline":  "border border-amber-700/50 text-amber-400 hover:bg-amber-950/30 hover:border-amber-600/60",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-8 rounded-md px-3 text-xs",
        lg:      "h-10 rounded-md px-8",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }
