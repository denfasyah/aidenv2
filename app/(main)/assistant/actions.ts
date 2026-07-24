"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

interface ConvertToWorkspaceParams {
  chatId: string
  title: string
  description?: string
  fileName: string
  fileBase64: string // Base64 of the PDF file
}

export async function convertToWorkspace({
  chatId,
  title,
  description,
  fileName,
  fileBase64,
}: ConvertToWorkspaceParams) {
  try {
    if (!title || !title.trim()) {
      return { error: "Judul workspace wajib diisi." }
    }
    if (!fileName || !fileBase64) {
      return { error: "File PDF wajib dilampirkan untuk membuat workspace." }
    }

    const supabase = (await createClient()) as any
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Anda harus login terlebih dahulu." }
    }

    // 1. Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert([{
        title: title.trim(),
        description: description?.trim() || "Workspace dibuat dari Assistant Chat",
        user_id: user.id,
      }])
      .select()
      .single()

    if (workspaceError || !workspace) {
      console.error("Error creating workspace:", workspaceError)
      return { error: `Gagal membuat workspace: ${workspaceError?.message || "Unknown error"}` }
    }

    // 2. Upload file PDF to Supabase Storage
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
    const storagePath = `${user.id}/${workspace.id}/${Date.now()}_${cleanFileName}`
    const buffer = Buffer.from(fileBase64, "base64")

    const { error: uploadError } = await supabase.storage
      .from("materials")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      // Delete the workspace we just created since upload failed
      await supabase.from("workspaces").delete().eq("id", workspace.id)
      return { error: `Gagal mengunggah file: ${uploadError.message}` }
    }

    // 3. Create a workspace chat session
    const { data: wsChat, error: wsChatError } = await supabase
      .from("chats")
      .insert([{
        user_id: user.id,
        workspace_id: workspace.id,
        title: "Diskusi Materi",
      }])
      .select()
      .single()

    if (wsChatError || !wsChat) {
      console.error("Error creating workspace chat:", wsChatError)
    } else {
      // 4. Fetch the global chat messages up to now
      const { data: oldMessages } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })

      if (oldMessages && oldMessages.length > 0) {
        // Map messages to new chat
        const newMessages = oldMessages.map((m: any) => ({
          chat_id: wsChat.id,
          role: m.role,
          content: m.content,
          created_at: m.created_at,
        }))

        const { error: messagesError } = await supabase
          .from("messages")
          .insert(newMessages)

        if (messagesError) {
          console.error("Error copying messages:", messagesError)
        }
      }
    }

    // 5. Log activity
    await supabase.from("activity_logs").insert([{
      user_id: user.id,
      action_type: "CREATE_WORKSPACE",
      details: { message: `Membuat workspace dari chat assistant: ${title}` }
    }])

    revalidatePath("/workspaces")
    revalidatePath("/dashboard")

    return { success: true, workspaceId: workspace.id }
  } catch (error: unknown) {
    console.error("convertToWorkspace error:", error)
    return { error: error instanceof Error ? error.message : "Terjadi kesalahan internal" }
  }
}
