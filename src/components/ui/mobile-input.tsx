"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MobileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label for the input */
  label?: string;
  /** Show large touch target */
  large?: boolean;
  /** Show icon prefix */
  icon?: React.ReactNode;
  /** Error message */
  error?: string;
}

const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, type, label, large, icon, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">
            {label}
          </label>
        )}
        <div
          className={cn(
            "relative flex items-center",
            large && "h-14",
            !large && "h-10"
          )}
        >
          {icon && (
            <div className="absolute left-3 text-neutral-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex w-full rounded-lg border bg-neutral-800 text-neutral-100 placeholder:text-neutral-500",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200",
              // Mobile touch optimizations
              "min-h-[44px]", // iOS recommended touch target
              "tap-highlight-transparent", // Remove tap highlight on mobile
              large && "h-14 px-4 text-base",
              !large && "h-10 px-3 text-sm",
              icon && (large ? "pl-10" : "pl-10"),
              error && "border-red-500 focus:ring-red-500",
              !error && "border-neutral-700",
              props.readOnly && "bg-neutral-800/50",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500 px-1">{error}</p>
        )}
      </div>
    );
  }
);
MobileInput.displayName = "MobileInput";

export { MobileInput };
