import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── KPI / Stat Card Skeleton ───────────────────────────────────
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 sm:size-10 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-3 w-24 max-w-full" />
            <Skeleton className="h-6 sm:h-7 w-32 max-w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonCardGrid({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ─── Table Skeleton ─────────────────────────────────────────────
export function SkeletonTable({ rows = 8, cols = 5, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 px-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-5 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" style={{ opacity: 1 - j * 0.15 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Chart Skeleton ─────────────────────────────────────────────
export function SkeletonChart({ height = 40, className }: { height?: number; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full rounded-lg" style={{ height: `${height * 4}px` }} />
      </CardContent>
    </Card>
  );
}

export function SkeletonBarChart({ bars = 14, height = 40 }: { bars?: number; height?: number }) {
  return (
    <div className="flex items-end gap-[2px]" style={{ height: `${height * 4}px` }}>
      {Array.from({ length: bars }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t"
          style={{
            height: `${Math.max(15, Math.random() * 100)}%`,
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonDistribution({ items = 4 }: { items?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── List / Activity Skeleton ───────────────────────────────────
export function SkeletonList({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5">
          <Skeleton className="size-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-3 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── Stats Row (4 cards on one line) ────────────────────────────
export function SkeletonStatsRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 sm:size-10 rounded-lg shrink-0" />
              <div className="min-w-0">
                <Skeleton className="h-3 w-20 mb-2 max-w-full" />
                <Skeleton className="h-6 sm:h-7 w-28 mb-1 max-w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Filter Bar Skeleton ────────────────────────────────────────
export function SkeletonFilters({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-[180px] rounded-md" />
      ))}
      <Skeleton className="h-10 w-24 rounded-md" />
    </div>
  );
}

// ─── Full Page Skeleton ─────────────────────────────────────────
interface SkeletonPageProps {
  title?: boolean;
  description?: boolean;
  filters?: boolean | number;
  cards?: boolean | number;
  charts?: boolean | number;
  table?: boolean | number;
  list?: boolean | number;
  className?: string;
}

export function SkeletonPage({
  title = true,
  description = true,
  filters = false,
  cards = false,
  charts = false,
  table = false,
  list = false,
  className,
}: SkeletonPageProps) {
  return (
    <div className={cn("flex flex-1 flex-col gap-4 p-4 pt-0", className)}>
      {/* Header */}
      {title && (
        <div className="space-y-1">
          <Skeleton className="h-8 w-64" />
          {description && <Skeleton className="h-4 w-96" />}
        </div>
      )}

      {/* Action buttons */}
      {title && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      )}

      {/* Filters */}
      {filters && <SkeletonFilters count={typeof filters === "number" ? filters : 3} />}

      {/* KPI Cards */}
      {cards && <SkeletonCardGrid count={typeof cards === "number" ? cards : 4} />}

      {/* Charts */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonChart />
          <SkeletonDistribution />
        </div>
      )}

      {/* Table */}
      {table && (
        <SkeletonTable rows={typeof table === "number" ? table : 8} />
      )}

      {/* List */}
      {list && (
        <SkeletonList rows={typeof list === "number" ? list : 5} />
      )}
    </div>
  );
}
