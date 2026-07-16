import { cn } from "@/lib/utils"

// ===================================
// SKELETON COMPONENTS
// ===================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/** Komponen dasar Skeleton — tampilan placeholder beranimasi shimmer */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton rounded-lg", className)}
      {...props}
    />
  )
}

/** Skeleton Card untuk statistik (Dashboard Stats) */
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

/** Skeleton untuk baris di tabel */
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  )
}

/** Skeleton untuk item riwayat di Timeline */
export function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 py-3">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

/** Skeleton untuk daftar workspace card */
export function WorkspaceCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2 mt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  )
}

/** Skeleton untuk panel chat */
export function ChatMessageSkeleton({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div className={cn("flex gap-2 items-end", align === "right" && "flex-row-reverse")}>
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex flex-col gap-1" style={{ maxWidth: "70%" }}>
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}
