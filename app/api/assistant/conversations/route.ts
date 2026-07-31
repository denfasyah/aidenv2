import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()


    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { data: chats, error } = await supabase
      .from("chats")
      .select("*")
      .is("workspace_id", null)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching chats:", error)
      return new NextResponse(error.message, { status: 500 })
    }

    return NextResponse.json(chats)
  } catch (error) {
    console.error("Conversations GET Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()


    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const title = body.title || "Percakapan Baru"

    const { data: chat, error } = await supabase
      .from("chats")
      .insert({
        user_id: user.id,
        workspace_id: null,
        title,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating chat:", error)
      return new NextResponse(error.message, { status: 500 })
    }

    // Log aktivitas percakapan baru ke activity_logs
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      workspace_id: null,
      action_type: "ASSISTANT_CHAT",
      details: {
        title: chat.title,
        target_url: `/assistant?chat=${chat.id}`,
      },
    })

    // Kirim notifikasi ke user
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "AI Assistant Baru",
      message: `Percakapan baru "${chat.title}" berhasil dimulai dengan AI.`,
    })

    return NextResponse.json(chat)
  } catch (error) {
    console.error("Conversations POST Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
