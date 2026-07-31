"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function createWorkspace(formData: FormData) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const file = formData.get("file") as File | null

  if (!title) {
    return { error: "Judul workspace tidak boleh kosong." }
  }

  // PDF wajib untuk context-aware AI
  if (!file || file.size === 0) {
    return { error: "File PDF wajib diunggah. Workspace memerlukan materi untuk konteks AI." }
  }

  if (file.type !== "application/pdf") {
    return { error: "Hanya file berformat PDF yang diperbolehkan." }
  }

  // Batasi ukuran file (misal 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { error: "Ukuran file terlalu besar. Maksimal 10MB." }
  }

  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Anda harus login untuk membuat workspace." }
  }

  // Insert workspace
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert([{ title, description, user_id: user.id }])
    .select()
    .single()

  if (error) {
    console.error("Error creating workspace:", error.message)
    return { error: `Gagal membuat workspace: ${error.message}` }
  }

  // Upload file PDF ke storage
  const fileName = `${user.id}/${workspace.id}/${Date.now()}_${file.name}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  const { error: uploadError } = await supabase.storage
    .from("materials")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true
    })

  if (uploadError) {
    console.error("Error uploading file:", uploadError.message)
    return { error: `Gagal mengunggah file: ${uploadError.message}` }
  }

  // Log aktivitas
  await supabase.from("activity_logs").insert([{
    user_id: user.id,
    action_type: "CREATE_WORKSPACE",
    details: { message: `Membuat workspace baru: ${title}` }
  }])

  revalidatePath("/workspaces")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteWorkspace(id: string) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "Unauthorized" }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("title")
    .eq("id", id)
    .single()

  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error deleting workspace:", error.message)
    return { error: "Gagal menghapus workspace." }
  }

  if (workspace) {
    await supabase.from("activity_logs").insert([{
      user_id: user.id,
      action_type: "DELETE_WORKSPACE",
      details: { message: `Menghapus workspace: ${workspace.title}` }
    }])
  }

  revalidatePath("/workspaces")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function toggleFavoriteWorkspace(id: string, currentStatus: boolean) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "Unauthorized" }

  const { error } = await supabase
    .from("workspaces")
    .update({ is_favorite: !currentStatus })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error toggling favorite:", error.message)
    return { error: "Gagal mengubah status favorit." }
  }

  revalidatePath("/workspaces")
  return { success: true }
}

export async function updateWorkspace(id: string, title: string, description: string) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "Unauthorized" }

  if (!title || !title.trim()) {
    return { error: "Judul workspace tidak boleh kosong." }
  }

  const { error } = await supabase
    .from("workspaces")
    .update({ title: title.trim(), description: description.trim() })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error updating workspace:", error.message)
    return { error: "Gagal memperbarui workspace." }
  }

  // Log aktivitas
  await supabase.from("activity_logs").insert([{
    user_id: user.id,
    action_type: "UPDATE_WORKSPACE",
    details: { message: `Memperbarui workspace: ${title}` }
  }])

  revalidatePath("/workspaces")
  revalidatePath("/dashboard")
  return { success: true }
}
