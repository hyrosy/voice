// In src/components/ui/Button.tsx

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // --- WITH THIS ---
        default: "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition-opacity",
        
        // --- (All other variants are fine) ---
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // --- 2. OPTIONAL: Make buttons rounded-full ---
        //    (You can change 'rounded-full' to 'rounded-lg' if you prefer)
        default: "h-10 px-4 py-2 rounded-full", // was rounded-md
        sm: "h-9 rounded-full px-3",            // was rounded-md
        lg: "h-11 rounded-full px-8",            // was rounded-md
        icon: "h-10 w-10 rounded-full",           // was rounded-md
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default", // You could change this to "lg" to make all buttons bigger
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
