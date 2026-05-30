import { Skeleton } from "@/components/ui/skeleton";

export function TableViewSkeleton() {
  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* Table Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Table Controls (Search/Filter) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Skeleton className="h-10 w-full sm:w-1/3 rounded-xl" />
        <Skeleton className="h-10 w-full sm:w-1/4 rounded-xl" />
      </div>

      {/* The Data Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {/* Table Header Row */}
        <div className="flex bg-slate-50 border-b border-slate-200 p-4 gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4 hidden sm:block" />
          <Skeleton className="h-4 w-1/4 hidden md:block" />
        </div>
        
        {/* Table Rows */}
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex p-4 gap-4 items-center">
              <div className="w-1/4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="w-1/4">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="w-1/4 hidden sm:block">
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="w-1/4 hidden md:flex justify-end">
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Area */}
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}
