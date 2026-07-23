import { createClient } from "@/utils/supabase/server"

export async function GET(req: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { data: notes, error } = await supabase
      .from("notes")
      .select("*, workspaces(title)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Fetch Notes Error:", error)
      return new Response("Failed to fetch notes", { status: 500 })
    }

    return Response.json({ notes })
  } catch (err) {
    console.error("GET Notes API Error:", err)
    return new Response("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { workspaceId, title, content, category } = await req.json()

    if (!title || !content) {
      return new Response("Title and content are required", { status: 400 })
    }

    let targetWorkspaceId = workspaceId

    // If workspaceId is not provided, pick user's first workspace to prevent FK constraint error
    if (!targetWorkspaceId) {
      const { data: firstWs } = await supabase
        .from("workspaces")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .single()
      targetWorkspaceId = firstWs?.id || null
    }

    const { data: newNote, error: insertError } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        workspace_id: targetWorkspaceId,
        title,
        content,
        category: category || "Personal Note",
      })
      .select()
      .single()

    if (insertError) {
      console.error("Create Note Error:", insertError)
      return new Response(insertError.message || "Failed to create note", { status: 500 })
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      workspace_id: workspaceId || null,
      action_type: "CREATE_NOTE",
      details: {
        title,
        target_url: "/notes",
      },
    })

    return Response.json({ note: newNote })
  } catch (err) {
    console.error("POST Notes API Error:", err)
    return new Response("Internal Server Error", { status: 500 })
  }
}
