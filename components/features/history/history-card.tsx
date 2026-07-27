import Link from "next/link"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import {
  BrainCircuit,
  Trophy,
  FileText,
  Bot,
  ExternalLink,
  Trash2,
  FolderPlus,
  FolderMinus,
  StickyNote,
  CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────
export interface ActivityLog {
  id: string
  action_type: string
  details: {
    title?: string
    target_url?: string
    cardCount?: number
    questionCount?: number
    score?: string
    correct?: string
    message?: string
  } | null
  created_at: string
  workspace_id: string | null
  workspaces: { id: string; title: string } | null
}

// ── Config map per action_type ──────────────────────────
const ACTION_CONFIG: Record<
  string,
  {
    label: string
    icon: React.ElementType
    color: string
    bgClass: string
    badgeClass: string
    getDescription: (log: ActivityLog) => string
  }
> = {
  GENERATE_FLASHCARD: {
    label: "Flashcard",
    icon: BrainCircuit,
    color: "text-emerald-500",
    bgClass: "bg-emerald-500/10",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    getDescription: (log) => {
      const title = log.details?.title ?? log.workspaces?.title ?? "dokumen"
      const count = log.details?.cardCount
      return count
        ? `Membuat ${count} flashcard dari "${title}"`
        : `Membuat flashcard dari "${title}"`
    },
  },
  GENERATE_QUIZ: {
    label: "Quiz",
    icon: Trophy,
    color: "text-yellow-500",
    bgClass: "bg-yellow-500/10",
    badgeClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    getDescription: (log) => {
      const title = log.details?.title ?? log.workspaces?.title ?? "materi"
      const count = log.details?.questionCount
      return count
        ? `Membuat ${count} soal quiz dari "${title}"`
        : `Membuat quiz dari "${title}"`
    },
  },
  SUBMIT_QUIZ_ATTEMPT: {
    label: "Attempt Quiz",
    icon: CheckCircle,
    color: "text-orange-500",
    bgClass: "bg-orange-500/10",
    badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    getDescription: (log) => {
      const title = log.details?.title ?? log.workspaces?.title ?? "quiz"
      const score = log.details?.score
      const correct = log.details?.correct
      if (score && correct) {
        return `Mengerjakan quiz "${title}" — skor ${score} (${correct} benar)`
      }
      return `Mengerjakan quiz "${title}"`
    },
  },
  GENERATE_SUMMARY: {
    label: "Ringkasan",
    icon: FileText,
    color: "text-blue-500",
    bgClass: "bg-blue-500/10",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    getDescription: (log) => {
      const title = log.details?.title ?? log.workspaces?.title ?? "dokumen"
      return `Meringkas materi "${title}"`
    },
  },
  ASSISTANT_CHAT: {
    label: "Chat AI",
    icon: Bot,
    color: "text-purple-500",
    bgClass: "bg-purple-500/10",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    getDescription: (log) => {
      const title = log.details?.title
      if (title && title !== "Percakapan Baru") {
        return `Memulai sesi chat: "${title}"`
      }
      return "Memulai sesi chat dengan AI Assistant"
    },
  },
  CREATE_WORKSPACE: {
    label: "Workspace",
    icon: FolderPlus,
    color: "text-cyan-500",
    bgClass: "bg-cyan-500/10",
    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    getDescription: (log) => {
      const msg = log.details?.message ?? ""
      // Extract workspace name from message like "Membuat workspace baru: X"
      const match = msg.match(/:\s*(.+)$/)
      const title = match?.[1] ?? log.details?.title ?? "workspace baru"
      return `Membuat workspace "${title}"`
    },
  },
  DELETE_WORKSPACE: {
    label: "Hapus",
    icon: FolderMinus,
    color: "text-red-400",
    bgClass: "bg-red-500/10",
    badgeClass: "bg-red-500/10 text-red-500 border-red-500/20",
    getDescription: (log) => {
      const msg = log.details?.message ?? ""
      const match = msg.match(/:\s*(.+)$/)
      const title = match?.[1] ?? "sebuah workspace"
      return `Menghapus workspace "${title}"`
    },
  },
  CREATE_NOTE: {
    label: "Catatan",
    icon: StickyNote,
    color: "text-lime-500",
    bgClass: "bg-lime-500/10",
    badgeClass: "bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/20",
    getDescription: (log) => {
      const title = log.details?.title ?? "catatan baru"
      return `Membuat catatan "${title}"`
    },
  },
}

const DEFAULT_CONFIG = {
  label: "Aktivitas",
  icon: FileText,
  color: "text-muted-foreground",
  bgClass: "bg-muted",
  badgeClass: "bg-secondary text-secondary-foreground border-border",
  getDescription: (log: ActivityLog) =>
    log.details?.message ?? log.details?.title ?? log.action_type.replace(/_/g, " "),
}

// ── Component ───────────────────────────────────────────
interface HistoryCardProps {
  log: ActivityLog
}

export function HistoryCard({ log }: HistoryCardProps) {
  const config    = ACTION_CONFIG[log.action_type] ?? DEFAULT_CONFIG
  const Icon      = config.icon
  const targetUrl = log.details?.target_url
  const description = config.getDescription(log)

  // Workspace sudah dihapus jika workspace_id ada tapi join workspaces null
  const isDeleted = log.workspace_id !== null && log.workspaces === null

  const formattedDate = format(new Date(log.created_at), "dd MMM yyyy, HH:mm", {
    locale: localeId,
  })

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-all duration-200 hover:border-primary/30 hover:bg-card/80 hover:shadow-sm">
      {/* Icon */}
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
          config.bgClass
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Description — aktivitas utama */}
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-1">
          {description}
        </p>

        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1">
          {/* badge tipe */}
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide",
              config.badgeClass
            )}
          >
            {config.label}
          </span>

          {/* tanggal */}
          <span className="text-[11px] text-muted-foreground">{formattedDate}</span>

          {/* workspace name */}
          {log.workspaces && (
            <span className="text-[11px] text-muted-foreground/70 truncate max-w-[140px]">
              · {log.workspaces.title}
            </span>
          )}

          {/* Deleted badge */}
          {isDeleted && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive">
              <Trash2 className="h-2.5 w-2.5" />
              Workspace dihapus
            </span>
          )}
        </div>
      </div>

      {/* Action Button — tampil on hover */}
      {!isDeleted && targetUrl && (
        <Link
          href={targetUrl}
          className="flex-shrink-0 inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-semibold rounded-lg bg-primary text-primary-foreground transition-all duration-150"
        >
          Buka
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}
