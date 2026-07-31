import { Bell, BellOff } from "lucide-react"

interface NotificationEmptyProps {
  isFiltered?: boolean
  hasSearch?: boolean
}

/**
 * Empty state untuk halaman Notifications.
 * Konsisten dengan HistoryEmpty.
 */
export function NotificationEmpty({ isFiltered = false, hasSearch = false }: NotificationEmptyProps) {
  const isSearchMode = hasSearch

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {isFiltered || isSearchMode ? (
          <BellOff className="h-8 w-8" />
        ) : (
          <Bell className="h-8 w-8" />
        )}
      </div>
      <h3 className="font-semibold text-foreground mb-2">
        {isSearchMode
          ? "Tidak Ada Hasil"
          : isFiltered
          ? "Tidak Ada Notifikasi"
          : "Semua Bersih"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {isSearchMode
          ? "Coba ubah kata kunci pencarian atau hapus filter."
          : isFiltered
          ? "Tidak ada notifikasi yang cocok dengan filter yang dipilih."
          : "Belum ada notifikasi. Mulai buat workspace, generate flashcard, atau chat dengan AI untuk melihat notifikasi di sini."}
      </p>
    </div>
  )
}
