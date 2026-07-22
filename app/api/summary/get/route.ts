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

    const { data: summary, error } = await supabase
      .from("summaries")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single()

    if (error && error.code !== "PGRST116") { // PGRST116 is "no rows found"
      console.error("Fetch Summary Error:", error)
      return new Response("Failed to fetch summary", { status: 500 })
    }

    return Response.json({ summary: summary ?? null })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    console.error("Fetch Summary API Error:", error)
    return new Response(message, { status: 500 })
  }
}
