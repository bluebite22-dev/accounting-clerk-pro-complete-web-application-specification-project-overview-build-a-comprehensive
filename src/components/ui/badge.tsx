import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-blue-600/20 text-blue-400 border border-blue-500/30",
        secondary: "bg-neutral-700 text-neutral-300",
        success: "bg-green-600/20 text-green-400 border border-green-500/30",
        warning: "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30",
        destructive: "bg-red-600/20 text-red-400 border border-red-500/30",
        outline: "border border-neutral-600 text-neutral-400",
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
