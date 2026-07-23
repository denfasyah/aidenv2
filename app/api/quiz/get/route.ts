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

    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Fetch quiz error:", error)
      return new Response("Error fetching quiz", { status: 500 })
    }

    return Response.json({ quiz: quiz || null })
  } catch (err) {
    console.error("Get Quiz API Error:", err)
    return new Response("Internal Server Error", { status: 500 })
  }
}
