import { History } from "lucide-react"
import { Card } from "@/components/ui"
import { HistoryCard } from "@/components/features/history"
import type { ActivityLog } from "@/components/features/history"

interface ActivityFeedProps {
  logs?: ActivityLog[]
}

/**
 * Feed aktivitas pengguna di halaman Dashboard.
 * Menampilkan maksimal 5 aktivitas terbaru.
 */
export function ActivityFeed({ logs = [] }: ActivityFeedProps) {
  if (logs.length === 0) {
    return (
      <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
          <History className="h-8 w-8" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Belum Ada Aktivitas</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Buat workspace baru atau generate flashcard dengan AI untuk memulai riwayat belajar Anda.
        </p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {logs.map((log) => (
        <HistoryCard key={log.id} log={log} />
      ))}
    </div>
  )
}
