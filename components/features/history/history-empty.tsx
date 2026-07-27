import { History } from "lucide-react"

interface HistoryEmptyProps {
  isFiltered?: boolean
}

/**
 * Empty state untuk halaman History.
 */
export function HistoryEmpty({ isFiltered = false }: HistoryEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border border-dashed bg-card/50 min-h-[280px]">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
        <History className="h-6 w-6 text-muted-foreground" />
      </div>
      {isFiltered ? (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-2">Tidak Ada Aktivitas</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Tidak ada aktivitas yang cocok dengan filter yang dipilih. Coba pilih jenis aktivitas
            lain.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Aktivitas</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Buat workspace, generate flashcard, quiz, summary, atau mulai sesi Assistant untuk
            memulai riwayat belajar kamu.
          </p>
        </>
      )}
    </div>
  )
}
