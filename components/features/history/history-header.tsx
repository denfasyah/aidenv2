import { Clock, BookOpen } from "lucide-react"

/**
 * Hero header untuk halaman History.
 * Mengikuti design system project — gradient border card dengan ikon.
 */
export function HistoryHeader() {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
          <Clock className="h-7 w-7" />
        </div>
        <div>
          <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            Audit Logs
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Learning Activity Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track semua interaksi AI, summary, flashcard, dan sesi belajar kamu dalam satu timeline.
          </p>
        </div>
      </div>
      <div className="flex-shrink-0 hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-muted/50 text-muted-foreground">
        <BookOpen className="h-6 w-6" />
      </div>
    </div>
  )
}
