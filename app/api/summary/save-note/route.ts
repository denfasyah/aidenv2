import { createClient } from "@/utils/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { workspaceId, title, content } = await req.json()

    if (!workspaceId || !content) {
      return new Response("Workspace ID and content are required", { status: 400 })
    }

    // Try inserting with category field
    const insertPayload: any = {
      workspace_id: workspaceId,
      user_id: user.id,
      title: title || "Ringkasan Materi",
      content: content,
      category: "Summary",
    }

    let newNote: any = null
    const { data: insertedData, error: insertError } = await supabase
      .from("notes")
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      console.error("Save Note Error:", insertError)
      // Fallback if category column doesn't exist in Supabase DB schema
      if (insertError.message?.includes("category")) {
        delete insertPayload.category
        const { data: retryData, error: retryError } = await supabase
          .from("notes")
          .insert(insertPayload)
          .select()
          .single()

        if (retryError) {
          console.error("Save Note Retry Error:", retryError)
          return new Response(retryError.message || "Failed to save note to database", { status: 500 })
        }
        newNote = retryData
      } else {
        return new Response(insertError.message || "Failed to save note to database", { status: 500 })
      }
    } else {
      newNote = insertedData
    }

    // Insert activity log for saving note
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      workspace_id: workspaceId,
      action_type: "CREATE_NOTE",
      details: {
        title: title || "Ringkasan Materi",
        target_url: `/notes`,
      },
    })

    return Response.json({ note: newNote })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    console.error("Save Note API Error:", error)
    return new Response(message, { status: 500 })
  }
}
