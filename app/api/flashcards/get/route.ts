import { createClient } from "@/utils/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { workspaceId } = await req.json()

    if (!workspaceId) {
      return new Response("Workspace ID is required", { status: 400 })
    }

    const { data: flashcards, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single()

    // PGRST116 = no rows found (not an error, just empty)
    if (error && error.code !== "PGRST116") {
      console.error("Fetch Flashcard Error:", error)
      return new Response("Gagal mengambil data flashcard", { status: 500 })
    }

    return Response.json({ flashcards: flashcards ?? null })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    console.error("Fetch Flashcard API Error:", error)
    return new Response(message, { status: 500 })
  }
}
