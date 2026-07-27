import { Suspense } from "react"
import { createClient } from "@/utils/supabase/server"
import {
  HistoryHeader,
  HistoryFilter,
  HistoryCard,
  HistoryPagination,
  HistoryEmpty,
} from "@/components/features/history"
import type { ActivityLog } from "@/components/features/history"

const PAGE_SIZE = 6

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const mapFilterToActions = (type: string): string[] | null => {
  switch (type) {
    case "FLASHCARD":
      return ["GENERATE_FLASHCARD"]
    case "QUIZ":
      return ["GENERATE_QUIZ", "SUBMIT_QUIZ_ATTEMPT"]
    case "SUMMARY":
      return ["GENERATE_SUMMARY"]
    case "NOTE":
      return ["CREATE_NOTE"]
    case "WORKSPACE":
      return ["CREATE_WORKSPACE", "DELETE_WORKSPACE"]
    case "CHAT":
      return ["ASSISTANT_CHAT"]
    default:
      return null
  }
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const params     = await searchParams
  const type       = (Array.isArray(params.type) ? params.type[0] : params.type) ?? ""
  const pageStr    = Array.isArray(params.page) ? params.page[0] : params.page
  const page       = Math.max(1, parseInt(pageStr ?? "1", 10))

  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = supabase
    .from("activity_logs")
    .select(
      `
      id,
      action_type,
      details,
      created_at,
      workspace_id,
      workspaces ( id, title )
      `,
      { count: "exact" }
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (type && type !== "ALL") {
    const actions = mapFilterToActions(type)
    if (actions) {
      query = query.in("action_type", actions)
    }
  }

  const { data: logs, error, count } = await query

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1
  const totalCount = count ?? 0
  const isFiltered = !!(type && type !== "ALL")

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Header */}
      <HistoryHeader />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Suspense
          fallback={<div className="h-10 w-56 rounded-lg bg-muted animate-pulse" />}
        >
          <HistoryFilter />
        </Suspense>

        {totalCount > 0 && (
          <p className="text-sm text-muted-foreground flex-shrink-0">
            {totalCount} aktivitas{isFiltered ? " (difilter)" : ""}
          </p>
        )}
      </div>

      {/* Content */}
      {error ? (
        <div className="p-8 text-center text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          Gagal memuat history: {error.message}
        </div>
      ) : !logs || logs.length === 0 ? (
        <HistoryEmpty isFiltered={isFiltered} />
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {(logs as ActivityLog[]).map((log) => (
              <HistoryCard key={log.id} log={log} />
            ))}
          </div>

          {/* Pagination — muncul hanya jika > 6 item */}
          <Suspense>
            <HistoryPagination currentPage={page} totalPages={totalPages} />
          </Suspense>
        </>
      )}
    </div>
  )
}
