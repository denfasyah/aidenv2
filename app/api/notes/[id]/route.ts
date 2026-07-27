import { createClient } from "@/utils/supabase/server"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { title, content, category } = await req.json()

    if (!title || !content) {
      return new Response("Title and content are required", { status: 400 })
    }

    const updateData: any = {
      title,
      content,
      updated_at: new Date().toISOString(),
    }
    if (category) {
      updateData.category = category
    }

    const { data: updatedNote, error: updateError } = await supabase
      .from("notes")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      // If error is caused by category column missing in DB schema, fallback without category
      if (updateError.message?.includes("category")) {
        const { data: retryNote, error: retryError } = await supabase
          .from("notes")
          .update({
            title,
            content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single()

        if (retryError) {
          console.error("Update Note Retry Error:", retryError)
          return new Response(retryError.message || "Failed to update note", { status: 500 })
        }
        return Response.json({ note: retryNote })
      }

      console.error("Update Note Error:", updateError)
      return new Response(updateError.message || "Failed to update note", { status: 500 })
    }

    return Response.json({ note: updatedNote })
  } catch (err) {
    console.error("PUT Note API Error:", err)
    return new Response("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { error: deleteError } = await supabase
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Delete Note Error:", deleteError)
      return new Response("Failed to delete note", { status: 500 })
    }

    // Mark note as deleted in activity logs
    try {
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("id, details")
        .eq("user_id", user.id)
        .eq("action_type", "CREATE_NOTE")

      if (logs) {
        const targetLog = logs.find((l: any) => l.details?.note_id === id)
        if (targetLog) {
          await supabase
            .from("activity_logs")
            .update({
              details: {
                ...targetLog.details,
                note_deleted: true
              }
            })
            .eq("id", targetLog.id)
        }
      }
    } catch (e) {
      console.error("Error updating activity log for deleted note:", e)
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error("DELETE Note API Error:", err)
    return new Response("Internal Server Error", { status: 500 })
  }
}
