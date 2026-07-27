import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

const PAGE_SIZE = 6

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

export async function GET(req: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || ""
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

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
      console.error("Deduplication error in history API:", e)
    }

    // Build query — left join workspace to check if still exists
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

    if (error) {
      console.error("History GET error:", error)
      return new NextResponse(error.message, { status: 500 })
    }

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

    return NextResponse.json({
      logs,
      total: count ?? 0,
      page,
      totalPages,
    })
  } catch (error) {
    console.error("History API Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
