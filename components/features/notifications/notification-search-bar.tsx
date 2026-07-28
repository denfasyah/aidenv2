"use client"

import { Search, Filter, CheckCheck } from "lucide-react"
import { Button, Input } from "@/components/ui"
import type { NotificationFilter } from "@/hooks/use-notifications"

// ── Filter options ──────────────────────────────────────────────────────────
const FILTER_OPTIONS: { value: NotificationFilter; label: string }[] = [
  { value: "all",    label: "Semua Notifikasi" },
  { value: "unread", label: "Belum Dibaca"     },
  { value: "read",   label: "Sudah Dibaca"     },
]

interface NotificationSearchBarProps {
  searchQuery: string
  filter: NotificationFilter
  hasUnread: boolean
  onSearchChange: (q: string) => void
  onFilterChange: (f: NotificationFilter) => void
  onMarkAllAsRead: () => void
  isMarkingAll?: boolean
}

/**
 * Search input + filter dropdown + Mark All as Read button.
 * Desain konsisten dengan HistoryFilter.
 */
export function NotificationSearchBar({
  searchQuery,
  filter,
  hasUnread,
  onSearchChange,
  onFilterChange,
  onMarkAllAsRead,
  isMarkingAll = false,
}: NotificationSearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Cari notifikasi..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary transition-colors"
        />
      </div>

      {/* Filter Dropdown */}
      <div className="relative flex-shrink-0">
        <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as NotificationFilter)}
          className="h-10 pl-8 pr-7 text-sm rounded-lg border border-border bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition min-w-[180px]"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mark All as Read */}
      <Button
        variant="outline"
        size="md"
        disabled={!hasUnread || isMarkingAll}
        onClick={onMarkAllAsRead}
        className="flex-shrink-0 gap-2 h-10"
      >
        <CheckCheck className="h-4 w-4" />
        Tandai Semua Dibaca
      </Button>
    </div>
  )
}
