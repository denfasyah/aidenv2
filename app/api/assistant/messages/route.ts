import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get("chatId")

    if (!chatId) {
      return new NextResponse("Chat ID is required", { status: 400 })
    }

    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify chat ownership
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single()

    if (chatError || !chat) {
      return new NextResponse("Chat not found or access denied", { status: 404 })
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      return new NextResponse(error.message, { status: 500 })
    }

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Messages GET Error:", error)
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

    const { chatId, role, content } = await req.json()

    if (!chatId || !role || !content) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Verify chat ownership
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single()

    if (chatError || !chat) {
      return new NextResponse("Chat not found or access denied", { status: 404 })
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        role,
        content,
      })
      .select()
      .single()

    if (error) {
      console.error("Error inserting message:", error)
      return new NextResponse(error.message, { status: 500 })
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("Messages POST Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
