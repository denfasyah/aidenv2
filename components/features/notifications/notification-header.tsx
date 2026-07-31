import { Bell, Inbox } from "lucide-react"

/**
 * Hero header untuk halaman Notifications.
 * Desain konsisten dengan HistoryHeader — gradient border card.
 */
export function NotificationHeader() {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
          <Bell className="h-7 w-7" />
        </div>
        <div>
          <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            Pusat Notifikasi
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Notification Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor updates dari AI Assistant, ringkasan, kuis, flashcard, dan aktivitas workspace kamu.
          </p>
        </div>
      </div>
      <div className="flex-shrink-0 hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-muted/50 text-muted-foreground">
        <Inbox className="h-6 w-6" />
      </div>
    </div>
  )
}
