import { createClient } from "@/utils/supabase/server"

/**
 * GET /api/notifications
 * Query params:
 *   - filter: "all" | "unread" | "read"  (default: "all")
 *   - q: string (search query against title + message)
 */
export async function GET(req: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter") ?? "all"
    const q      = searchParams.get("q")?.trim() ?? ""

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (filter === "unread") {
      query = query.eq("is_read", false)
    } else if (filter === "read") {
      query = query.eq("is_read", true)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error("Fetch Notifications Error:", error)
      return new Response("Failed to fetch notifications", { status: 500 })
    }

    // Client-side search filter (title + message)
    const filtered = q
      ? (notifications ?? []).filter(
          (n: any) =>
            n.title.toLowerCase().includes(q.toLowerCase()) ||
            n.message.toLowerCase().includes(q.toLowerCase())
        )
      : (notifications ?? [])

    const unreadCount = (notifications ?? []).filter((n: any) => !n.is_read).length

    return Response.json({ notifications: filtered, unreadCount })
  } catch (err) {
    console.error("GET Notifications Error:", err)
    return new Response("Internal Server Error", { status: 500 })
  }
}

/**
 * PATCH /api/notifications
 * Marks ALL notifications for the current user as read.
 */
export async function PATCH() {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (error) {
      console.error("Mark All Read Error:", error)
      return new Response("Failed to mark all as read", { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error("PATCH Notifications Error:", err)
    return new Response("Internal Server Error", { status: 500 })
  }
}
