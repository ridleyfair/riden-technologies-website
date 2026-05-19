import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        secondary: "bg-riden-muted text-slate-300 border border-riden-border",
        destructive: "bg-red-500/10 text-red-400 border border-red-500/20",
        success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        violet: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
        cyan: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
        outline: "border border-riden-border text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
