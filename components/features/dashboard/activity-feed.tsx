import { History } from "lucide-react"
import { Card } from "@/components/ui"

/**
 * Placeholder untuk feed aktivitas pengguna.
 * Akan diganti dengan data nyata dari tabel activity_logs pada Fase 6.
 */
export function ActivityFeed() {
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
