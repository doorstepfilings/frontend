import { Skeleton } from "@/components/ui/skeleton";

export function TableViewSkeleton() {
  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row">
        <Skeleton className="h-10 w-full rounded-xl sm:w-1/3" />
        <Skeleton className="h-10 w-full rounded-xl sm:w-1/4" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex gap-4 border-b border-slate-200 bg-slate-50 p-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="hidden h-4 w-1/4 sm:block" />
          <Skeleton className="hidden h-4 w-1/4 md:block" />
        </div>

        <div className="divide-y divide-slate-100">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="w-1/4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="w-1/4">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="hidden w-1/4 sm:block">
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="hidden w-1/4 justify-end md:flex">
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}
