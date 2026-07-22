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

    // Insert new note linked to the workspace
    const { data: newNote, error: insertError } = await supabase
      .from("notes")
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        title: title || "Ringkasan Materi",
        content: content,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Save Note Error:", insertError)
      return new Response("Failed to save note to database", { status: 500 })
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
