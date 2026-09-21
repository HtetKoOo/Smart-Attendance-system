import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPageSkeleton() {
  return (
    <div
      className="space-y-8"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="space-y-3">
        <Skeleton className="h-9 w-56 max-w-[70vw]" />
        <Skeleton className="h-5 w-96 max-w-[85vw]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-36 max-w-full" />
              </div>
              <Skeleton className="size-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64 max-w-[75vw]" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="grid grid-cols-4 gap-4 rounded-lg border border-border/50 p-4"
            >
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="hidden h-4 w-full sm:block" />
              <Skeleton className="hidden h-4 w-full sm:block" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading dashboard content…</span>
    </div>
  );
}
