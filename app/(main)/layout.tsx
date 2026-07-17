import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { UserSidebar } from "@/components/layout/user-sidebar"
import { TopNavbar } from "@/components/layout/top-navbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Ambil data user dari sesi aktif
  const { data: { user }, error } = await supabase.auth.getUser()

  // Jika tidak ada user (belum login) atau error, lempar ke halaman login
  if (error || !user) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar - Fixed di kiri */}
      <UserSidebar />

      {/* Konten Utama */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar 
          userEmail={user.email} 
          userName={user.user_metadata?.full_name} 
        />

        {/* Main Content Area (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
