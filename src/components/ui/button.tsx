"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white hover:bg-blue-500 shadow-glow hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]",
        destructive:
          "bg-red-600 text-white hover:bg-red-500",
        outline:
          "border border-riden-border bg-transparent text-white hover:bg-riden-muted hover:border-blue-500/50",
        secondary:
          "bg-riden-muted text-white hover:bg-riden-border",
        ghost:
          "text-slate-300 hover:bg-riden-muted hover:text-white",
        link:
          "text-blue-400 underline-offset-4 hover:underline hover:text-blue-300",
        gradient:
          "bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-600 text-white hover:opacity-90 shadow-glow",
        glass:
          "glass text-white hover:bg-white/10 border-white/10",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
