"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MobileInput } from "./mobile-input";
import { MobileSelect } from "./mobile-select";
import { MobileTextarea } from "./mobile-textarea";
import { MobileButton } from "./mobile-button";

interface FormField {
  id: string;
  type: "input" | "select" | "textarea" | "date" | "number" | "email" | "password";
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface MobileFormProps {
  /** Form title */
  title?: string;
  /** Form fields */
  fields: FormField[];
  /** Form data */
  data: Record<string, any>;
  /** Errors */
  errors?: Record<string, string>;
  /** Loading state */
  loading?: boolean;
  /** Submit label */
  submitLabel?: string;
  /** Cancel label */
  cancelLabel?: string;
  /** Show cancel button */
  showCancel?: boolean;
  /** Additional actions */
  actions?: React.ReactNode;
  /** Full width submit */
  fullWidthSubmit?: boolean;
  /** Callback when data changes */
  onChange: (field: string, value: any) => void;
  /** Callback when form is submitted */
  onSubmit?: () => void;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
  /** Additional CSS class */
  className?: string;
}

/** Mobile-optimized form layout with proper spacing and touch targets */
export function MobileForm({
  title,
  fields,
  data,
  errors,
  loading,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  showCancel = true,
  actions,
  fullWidthSubmit = true,
  onChange,
  onSubmit,
  onCancel,
  className,
}: MobileFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-5 p-4", className)}
    >
      {title && (
        <h2 className="text-xl font-semibold text-neutral-100">{title}</h2>
      )}

      {/* Form fields */}
      <div className="space-y-5">
        {fields.map((field) => {
          const error = errors?.[field.id] || field.error;

          switch (field.type) {
            case "select":
              return (
                <MobileSelect
                  key={field.id}
                  label={field.label}
                  options={field.options || []}
                  value={data[field.id]}
                  placeholder={field.placeholder}
                  error={error}
                  disabled={field.disabled}
                  onChange={(value) => onChange(field.id, value)}
                />
              );

            case "textarea":
              return (
                <MobileTextarea
                  key={field.id}
                  label={field.label}
                  value={data[field.id]}
                  placeholder={field.placeholder}
                  error={error}
                  disabled={field.disabled}
                  onChange={(e) => onChange(field.id, e.target.value)}
                />
              );

            case "date":
            case "email":
            case "password":
            case "number":
              return (
                <MobileInput
                  key={field.id}
                  type={field.type}
                  label={field.label}
                  value={data[field.id]}
                  placeholder={field.placeholder}
                  error={error}
                  disabled={field.disabled}
                  icon={field.icon}
                  large
                  onChange={(e) => onChange(field.id, e.target.value)}
                />
              );

            default:
              return (
                <MobileInput
                  key={field.id}
                  type={field.type}
                  label={field.label}
                  value={data[field.id]}
                  placeholder={field.placeholder}
                  error={error}
                  disabled={field.disabled}
                  icon={field.icon}
                  large
                  onChange={(e) => onChange(field.id, e.target.value)}
                />
              );
          }
        })}
      </div>

      {/* Additional actions */}
      {actions && <div className="flex gap-3">{actions}</div>}

      {/* Form actions */}
      <div
        className={cn(
          "flex gap-3 pt-4 border-t border-neutral-800",
          fullWidthSubmit ? "flex-col" : "flex-row"
        )}
      >
        {showCancel && (
          <MobileButton
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            fullWidth={fullWidthSubmit}
          >
            {cancelLabel}
          </MobileButton>
        )}
        <MobileButton
          type="submit"
          loading={loading}
          fullWidth={fullWidthSubmit}
        >
          {submitLabel}
        </MobileButton>
      </div>
    </form>
  );
}

/** Card wrapper for mobile forms */
export function MobileFormCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-800 bg-neutral-900/50 backdrop-blur",
        className
      )}
    >
      {children}
    </div>
  );
}
