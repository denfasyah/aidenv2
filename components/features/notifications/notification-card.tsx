"use client"

import { formatDistanceToNow } from "date-fns"
import { id as localeId } from "date-fns/locale"
import {
  BrainCircuit,
  Trophy,
  FileText,
  Bot,
  StickyNote,
  CheckCheck,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Notification } from "@/hooks/use-notifications"

// ── Config map per tipe notifikasi (berdasarkan title keyword) ─────────────
interface NotifConfig {
  icon: LucideIcon
  color: string
  bgClass: string
  badgeClass: string
  badgeLabel: string
}

/**
 * Menentukan config visual berdasarkan title notifikasi.
 * Fallback ke ikon FileText jika tidak ada kecocokan.
 */
function resolveConfig(title: string): NotifConfig {
  const t = title.toLowerCase()

  if (t.includes("flashcard"))
    return {
      icon: BrainCircuit,
      color: "text-emerald-500",
      bgClass: "bg-emerald-500/10",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      badgeLabel: "Flashcard",
    }

  if (t.includes("quiz"))
    return {
      icon: Trophy,
      color: "text-yellow-500",
      bgClass: "bg-yellow-500/10",
      badgeClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      badgeLabel: "Quiz",
    }

  if (t.includes("ringkasan") || t.includes("summary"))
    return {
      icon: FileText,
      color: "text-blue-500",
      bgClass: "bg-blue-500/10",
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      badgeLabel: "Ringkasan",
    }

  if (t.includes("note") || t.includes("catatan"))
    return {
      icon: StickyNote,
      color: "text-lime-500",
      bgClass: "bg-lime-500/10",
      badgeClass: "bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/20",
      badgeLabel: "Catatan",
    }

  if (t.includes("ai") || t.includes("assistant") || t.includes("chat"))
    return {
      icon: Bot,
      color: "text-purple-500",
      bgClass: "bg-purple-500/10",
      badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      badgeLabel: "AI Chat",
    }

  return {
    icon: FileText,
    color: "text-muted-foreground",
    bgClass: "bg-muted",
    badgeClass: "bg-secondary text-secondary-foreground border-border",
    badgeLabel: "Notifikasi",
  }
}

// ── Component ──────────────────────────────────────────────────────────────
interface NotificationCardProps {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
  animationIndex?: number
}

export function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
  animationIndex = 0,
}: NotificationCardProps) {
  const config    = resolveConfig(notification.title)
  const Icon      = config.icon
  const isUnread  = !notification.is_read

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: localeId,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, delay: animationIndex * 0.04 }}
      className={cn(
        "group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all duration-200",
        "hover:border-primary/30 hover:bg-card/80 hover:shadow-sm",
        isUnread ? "border-primary/20" : "border-border"
      )}
    >
      {/* Unread dot */}
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            config.bgClass
          )}
        >
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        {isUnread && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Timestamp */}
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">
          {timeAgo}
        </p>

        {/* Title */}
        <p
          className={cn(
            "text-sm font-semibold leading-snug line-clamp-1",
            isUnread ? "text-foreground" : "text-foreground/80"
          )}
        >
          {notification.title}
        </p>

        {/* Message */}
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {notification.message}
        </p>

        {/* Badge */}
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide",
              config.badgeClass
            )}
          >
            {config.badgeLabel}
          </span>
        </div>
      </div>

      {/* Actions — visible on hover (atau selalu di mobile) */}
      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {isUnread && (
          <button
            onClick={() => onMarkRead(notification.id)}
            title="Tandai sudah dibaca"
            className="h-8 px-2.5 text-[11px] font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors flex items-center gap-1"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mark Read</span>
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          title="Hapus notifikasi"
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/15 text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}
