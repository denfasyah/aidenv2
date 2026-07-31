import { BookOpen, BrainCircuit, GraduationCap, FileText } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { StatCard }      from "@/components/features/dashboard/stat-card"
import { ActivityFeed }  from "@/components/features/dashboard/activity-feed"
import { QuickActions }  from "@/components/features/dashboard/quick-actions"

export default async function DashboardPage() {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "User"

  // Fetch real counts from Supabase dynamically
  const { count: workspacesCount } = await supabase
    .from("workspaces")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { count: flashcardsCount } = await supabase
    .from("flashcards")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { count: quizzesCount } = await supabase
    .from("quizzes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { count: summariesCount } = await supabase
    .from("summaries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Fetch the latest 5 activity logs
  const { data: latestLogs } = await supabase
    .from("activity_logs")
    .select(`
      id,
      action_type,
      details,
      created_at,
      workspace_id,
      workspaces ( id, title )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

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
        <StatCard title="Total Workspaces" value={workspacesCount ?? 0} icon={BookOpen}      description="Ruang kerja aktif"        />
        <StatCard title="Flashcards"       value={flashcardsCount ?? 0} icon={BrainCircuit}  description="Kartu pintar dibuat"      />
        <StatCard title="Sesi Belajar"     value={quizzesCount ?? 0} icon={GraduationCap} description="Kuis diselesaikan"  />
        <StatCard title="Total Ringkasan"    value={summariesCount ?? 0} icon={FileText}        description="Ringkasan AI"         />
      </div>

      {/* Konten Bawah: Feed + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Aktivitas Terakhir</h2>
            <Link href="/history" className="text-sm font-medium text-primary hover:underline transition-all">
              Lihat Semua
            </Link>
          </div>
          <ActivityFeed logs={latestLogs || []} />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">Rekomendasi</h2>
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
