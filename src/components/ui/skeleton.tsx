import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: number | string;
  height?: number | string;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  ...props
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-neutral-200 dark:bg-neutral-700";

  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      {...props}
    />
  );
}

// Pre-defined skeleton components for common use cases

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" variant="text" />
          <Skeleton className="h-8 w-32" variant="text" />
          <Skeleton className="h-4 w-20" variant="text" />
        </div>
        <Skeleton className="h-12 w-12" variant="circular" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="grid gap-4 p-4 sm:grid-cols-4">
          <Skeleton className="h-4 w-20" variant="text" />
          <Skeleton className="h-4 w-20" variant="text" />
          <Skeleton className="h-4 w-20" variant="text" />
          <Skeleton className="h-4 w-20" variant="text" />
        </div>
      </div>
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid gap-4 p-4 sm:grid-cols-4 items-center">
            <Skeleton className="h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-3/4" variant="text" />
            <Skeleton className="h-4 w-1/2" variant="text" />
            <Skeleton className="h-4 w-20" variant="text" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" variant="text" />
          <Skeleton className="h-10 w-full" variant="rectangular" />
        </div>
      ))}
      <div className="flex gap-4 pt-4">
        <Skeleton className="h-10 w-24" variant="rectangular" />
        <Skeleton className="h-10 w-24" variant="rectangular" />
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
        >
          <Skeleton className="h-12 w-12" variant="circular" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" variant="text" />
            <Skeleton className="h-3 w-1/2" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatsGrid({ items = 4 }: { items?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 300 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <Skeleton className="h-6 w-48 mb-4" variant="text" />
      <Skeleton className="w-full" style={{ height }} variant="rectangular" />
    </div>
  );
}

export function SkeletonInline({ height = 20, width }: { height?: number; width?: number | string }) {
  return <Skeleton height={height} width={width} variant="text" />;
}
