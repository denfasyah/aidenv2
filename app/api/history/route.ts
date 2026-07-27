import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

const PAGE_SIZE = 6

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
      query = query.eq("action_type", type)
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error("History GET error:", error)
      return new NextResponse(error.message, { status: 500 })
    }

    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1

    return NextResponse.json({
      logs: logs ?? [],
      total: count ?? 0,
      page,
      totalPages,
    })
  } catch (error) {
    console.error("History API Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
