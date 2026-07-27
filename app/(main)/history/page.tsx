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

  // Deduplicate GENERATE_FLASHCARD, GENERATE_QUIZ, GENERATE_SUMMARY per workspace globally for the user
  try {
    const { data: allLogs } = await supabase
      .from("activity_logs")
      .select("id, action_type, workspace_id, created_at")
      .eq("user_id", user.id)
      .in("action_type", ["GENERATE_FLASHCARD", "GENERATE_QUIZ", "GENERATE_SUMMARY"])
      .order("created_at", { ascending: false })

    if (allLogs && allLogs.length > 0) {
      const seenKeys = new Set<string>()
      const duplicateIds: string[] = []
      for (const l of allLogs) {
        if (l.workspace_id) {
          const key = `${l.action_type}_${l.workspace_id}`
          if (seenKeys.has(key)) {
            duplicateIds.push(l.id)
          } else {
            seenKeys.add(key)
          }
        }
      }
      if (duplicateIds.length > 0) {
        await supabase
          .from("activity_logs")
          .delete()
          .in("id", duplicateIds)
      }
    }
  } catch (e) {
    console.error("Deduplication error in HistoryPage:", e)
  }

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

  const { data: rawLogs, error, count } = await query
  const logs = rawLogs || []

  // Self-healing / validation check for notes & chats existence
  if (logs && logs.length > 0) {
    const noteIdsToCheck = logs
      .filter((l: any) => l.action_type === "CREATE_NOTE" && l.details?.note_id && !l.details?.note_deleted)
      .map((l: any) => l.details.note_id)

    const olderNoteLogs = logs.filter((l: any) => l.action_type === "CREATE_NOTE" && !l.details?.note_id && !l.details?.note_deleted)

    const chatIdsToCheck = logs
      .filter((l: any) => l.action_type === "ASSISTANT_CHAT" && !l.workspace_id && !l.details?.chat_deleted)
      .map((l: any) => {
        const match = l.details?.target_url?.match(/chat=([^&]+)/)
        return match ? match[1] : null
      })
      .filter(Boolean)

    // 1. Check notes
    let existingNoteIds: string[] = []
    if (noteIdsToCheck.length > 0) {
      const { data: notes } = await supabase
        .from("notes")
        .select("id")
        .in("id", noteIdsToCheck)
      existingNoteIds = notes?.map((n: any) => n.id) || []
    }

    let existingNoteTitles: string[] = []
    if (olderNoteLogs.length > 0) {
      const { data: notesByTitle } = await supabase
        .from("notes")
        .select("title")
        .in("title", olderNoteLogs.map((l: any) => l.details.title))
      existingNoteTitles = notesByTitle?.map((n: any) => n.title) || []
    }

    // 2. Check chats
    let existingChatIds: string[] = []
    if (chatIdsToCheck.length > 0) {
      const { data: chats } = await supabase
        .from("chats")
        .select("id")
        .in("id", chatIdsToCheck)
      existingChatIds = chats?.map((c: any) => c.id) || []
    }

    // Update in database and in-memory log list if they are deleted
    for (const log of logs) {
      if (log.action_type === "CREATE_NOTE" && !log.details?.note_deleted) {
        const noteId = log.details?.note_id
        const title = log.details?.title
        const exists = noteId ? existingNoteIds.includes(noteId) : existingNoteTitles.includes(title)
        
        if (!exists) {
          log.details = { ...log.details, note_deleted: true }
          await supabase
            .from("activity_logs")
            .update({ details: log.details })
            .eq("id", log.id)
        }
      } else if (log.action_type === "ASSISTANT_CHAT" && !log.workspace_id && !log.details?.chat_deleted) {
        const match = log.details?.target_url?.match(/chat=([^&]+)/)
        const chatId = match ? match[1] : null
        if (chatId && !existingChatIds.includes(chatId)) {
          log.details = { ...log.details, chat_deleted: true }
          await supabase
            .from("activity_logs")
            .update({ details: log.details })
            .eq("id", log.id)
        }
      }
    }
  }

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
