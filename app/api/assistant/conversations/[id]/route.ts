import { NextResponse } from "next/server"
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
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { title } = await req.json()

    if (!title || !title.trim()) {
      return new NextResponse("Title is required", { status: 400 })
    }

    const { data: chat, error } = await supabase
      .from("chats")
      .update({ title: title.trim() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating chat:", error)
      return new NextResponse(error.message, { status: 500 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error("Conversation PUT Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
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
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting chat:", error)
      return new NextResponse(error.message, { status: 500 })
    }

    return new NextResponse("Deleted", { status: 200 })
  } catch (error) {
    console.error("Conversation DELETE Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
