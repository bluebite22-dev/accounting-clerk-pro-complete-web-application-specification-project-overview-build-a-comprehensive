"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MobileTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label for the textarea */
  label?: string;
  /** Error message */
  error?: string;
  /** Show character count */
  showCount?: boolean;
  /** Maximum character count */
  maxLength?: number;
}

const MobileTextarea = React.forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({ className, label, error, showCount, maxLength, ...props }, ref) => {
    const [length, setLength] = React.useState(
      props.value?.toString().length || props.defaultValue?.toString().length || 0
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLength(e.target.value.length);
      props.onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            className={cn(
              "flex w-full rounded-lg border bg-neutral-800 px-3 py-2 text-neutral-100 placeholder:text-neutral-500",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200 resize-none",
              // Mobile touch optimizations
              "min-h-[100px]", // Larger default height for mobile
              "min-h-[44px]", // iOS recommended touch target
              "text-base", // Prevents zoom on iOS
              "p-3",
              error && "border-red-500 focus:ring-red-500",
              !error && "border-neutral-700 hover:border-neutral-600",
              className
            )}
            ref={ref}
            maxLength={maxLength}
            {...props}
            onChange={handleChange}
          />
          {showCount && maxLength && (
            <div className="absolute bottom-2 right-2 text-xs text-neutral-500">
              {length}/{maxLength}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-500 px-1">{error}</p>}
      </div>
    );
  }
);
MobileTextarea.displayName = "MobileTextarea";

export { MobileTextarea };
