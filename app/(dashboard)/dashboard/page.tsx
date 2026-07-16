import { createClient } from "@/utils/supabase/server"
import { BookOpen, BrainCircuit, GraduationCap, Clock, History } from "lucide-react"
import { Card } from "@/components/ui"

// Fungsi Helper untuk Card Statistik
function StatCard({ title, value, icon: Icon, description }: any) {
  return (
    <Card className="p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-foreground">{value}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          {description}
        </p>
      )}
    </Card>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "User"

  return (
    <div className="flex flex-col gap-8">
      {/* Header Greeting */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Selamat Datang, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground">
          Berikut adalah ringkasan aktivitas belajar Anda hari ini.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Total Workspaces" 
          value="0" 
          icon={BookOpen} 
          description="Ruang kerja aktif"
        />
        <StatCard 
          title="Flashcards" 
          value="0" 
          icon={BrainCircuit} 
          description="Kartu pintar dibuat"
        />
        <StatCard 
          title="Sesi Belajar" 
          value="0" 
          icon={GraduationCap} 
          description="Total sesi diselesaikan"
        />
        <StatCard 
          title="Waktu Belajar" 
          value="0j" 
          icon={Clock} 
          description="Dalam minggu ini"
        />
      </div>

      {/* Activity Feed Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">Aktivitas Terakhir</h2>
          <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
              <History className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Belum Ada Aktivitas</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Buat workspace baru atau generate flashcard dengan AI untuk memulai riwayat belajar Anda.
            </p>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">Rekomendasi AI</h2>
          <Card className="p-6 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
            <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
              <BrainCircuit className="h-4 w-4" />
              Mulai Cepat
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Biarkan Asisten AI membantu Anda membuat ringkasan dan kartu flash otomatis.
            </p>
            <button className="w-full text-sm font-medium bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Buka Assistant
            </button>
          </Card>
        </div>
      </div>
    </div>
  )
}
