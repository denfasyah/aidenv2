import { BookOpen, BrainCircuit, GraduationCap, Clock } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { StatCard }      from "@/components/features/dashboard/stat-card"
import { ActivityFeed }  from "@/components/features/dashboard/activity-feed"
import { QuickActions }  from "@/components/features/dashboard/quick-actions"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "User"

  return (
    <div className="flex flex-col gap-8">
      {/* Salam */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Selamat Datang, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground">
          Berikut adalah ringkasan aktivitas belajar Anda hari ini.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Total Workspaces" value={0} icon={BookOpen}      description="Ruang kerja aktif"        />
        <StatCard title="Flashcards"       value={0} icon={BrainCircuit}  description="Kartu pintar dibuat"      />
        <StatCard title="Sesi Belajar"     value={0} icon={GraduationCap} description="Total sesi diselesaikan"  />
        <StatCard title="Waktu Belajar"    value="0j" icon={Clock}        description="Dalam minggu ini"         />
      </div>

      {/* Konten Bawah: Feed + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">Aktivitas Terakhir</h2>
          <ActivityFeed />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">Rekomendasi AI</h2>
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
