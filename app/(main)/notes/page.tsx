import { createClient } from "@/utils/supabase/server"
import { NotesClient } from "@/components/features/notes/notes-client"

export default async function NotesPage() {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch user workspaces for the dropdown select in New Note modal
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <NotesClient initialWorkspaces={workspaces || []} />
}
