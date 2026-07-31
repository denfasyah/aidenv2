import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { ProfileClient } from "@/components/features/profile/profile-client"

export default async function ProfilePage() {
  const supabase = (await createClient()) as any
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Ambil data detail profil dari tabel public.users server-side
  let { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!dbUser) {
    // Jika data di tabel users belum ada, lakukan inisialisasi / upsert otomatis
    const initialName = user.user_metadata?.full_name || "User"
    const { data: newDbUser } = await supabase
      .from("users")
      .upsert({
        id: user.id,
        full_name: initialName,
        role: "user",
      })
      .select()
      .single()
    dbUser = newDbUser
  }

  return (
    <ProfileClient
      initialProfile={dbUser}
      initialEmail={user.email || ""}
    />
  )
}
