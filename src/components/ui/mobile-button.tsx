"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "success" | "warning";
  /** Button size - mobile optimized sizes */
  size?: "sm" | "default" | "lg" | "xl";
  /** Loading state */
  loading?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Icon to display */
  icon?: React.ReactNode;
  /** Icon position */
  iconPosition?: "left" | "right";
}

const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      loading,
      fullWidth,
      icon,
      iconPosition = "left",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
      outline:
        "border border-neutral-700 bg-transparent hover:bg-neutral-800 text-neutral-200 focus-visible:ring-neutral-500",
      secondary:
        "bg-neutral-700 text-neutral-100 hover:bg-neutral-600 focus-visible:ring-neutral-500",
      ghost: "hover:bg-neutral-800 hover:text-neutral-100 text-neutral-300 focus-visible:ring-neutral-500",
      success:
        "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
      warning:
        "bg-yellow-600 text-white hover:bg-yellow-700 focus-visible:ring-yellow-500",
    };

    const sizes = {
      // Mobile-optimized sizes with minimum 44px touch targets
      sm: "h-10 rounded-md px-4 text-sm",
      default: "h-12 px-6 text-base",
      lg: "h-14 rounded-lg px-8 text-lg",
      xl: "h-16 rounded-xl px-10 text-xl",
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          loading && "opacity-70 cursor-wait",
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : icon && iconPosition === "left" ? (
          <span className="mr-2">{icon}</span>
        ) : null}
        {children}
        {icon && iconPosition === "right" && !loading && (
          <span className="ml-2">{icon}</span>
        )}
      </button>
    );
  }
);
MobileButton.displayName = "MobileButton";

export { MobileButton };
