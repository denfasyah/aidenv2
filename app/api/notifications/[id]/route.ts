import { createClient } from "@/utils/supabase/server"

/**
 * PATCH /api/notifications/[id]
 * Toggles or sets is_read = true for a single notification.
 */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }   = await params
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Mark Read Error:", error)
      return new Response("Failed to mark notification as read", { status: 500 })
    }

    return Response.json({ notification: data })
  } catch (err) {
    console.error("PATCH Notification Error:", err)
    return new Response("Internal Server Error", { status: 500 })
  }
}

/**
 * DELETE /api/notifications/[id]
 * Deletes a single notification belonging to the current user.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }   = await params
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Delete Notification Error:", error)
      return new Response("Failed to delete notification", { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error("DELETE Notification Error:", err)
    return new Response("Internal Server Error", { status: 500 })
  }
}
