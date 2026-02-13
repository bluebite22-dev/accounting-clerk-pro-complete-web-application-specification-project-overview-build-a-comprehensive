"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

export interface MobileSelectProps {
  /** Label for the select */
  label?: string;
  /** Options to display */
  options: { value: string; label: string }[];
  /** Selected value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Large touch target */
  large?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
}

export function MobileSelect({
  label,
  options,
  value,
  defaultValue,
  placeholder = "Select...",
  error,
  disabled,
  large = true,
  className,
  onChange,
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(
    defaultValue || value || ""
  );
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Update internal value when prop changes
  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    setInternalValue(optionValue);
    setIsOpen(false);
    onChange?.(optionValue);
  };

  const selectedOption = options.find((opt) => opt.value === internalValue);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-neutral-300">
          {label}
        </label>
      )}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border bg-neutral-800 text-left",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200",
            "min-h-[44px]", // iOS recommended touch target
            large && "h-14 px-4 text-base",
            !large && "h-10 px-3 text-sm",
            error && "border-red-500 focus:ring-red-500",
            !error && "border-neutral-700 hover:border-neutral-600"
          )}
        >
          <span
            className={cn(
              "truncate",
              selectedOption ? "text-neutral-100" : "text-neutral-500"
            )}
          >
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-neutral-500 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-3 text-left",
                  "min-h-[44px]", // Touch-friendly
                  "hover:bg-neutral-800 transition-colors",
                  "focus:outline-none focus:bg-neutral-800",
                  option.value === internalValue && "bg-neutral-800"
                )}
              >
                <span className="text-neutral-100">{option.label}</span>
                {option.value === internalValue && (
                  <Check className="h-5 w-5 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500 px-1">{error}</p>}
    </div>
  );
}
