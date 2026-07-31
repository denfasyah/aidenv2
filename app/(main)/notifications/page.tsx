"use client"

import { AnimatePresence } from "framer-motion"
import {
  NotificationHeader,
  NotificationSearchBar,
  NotificationCard,
  NotificationEmpty,
} from "@/components/features/notifications"
import { useNotifications } from "@/hooks/use-notifications"

/**
 * Halaman /notifications
 * Client Component — semua state dikelola via useNotifications hook.
 * Layout & struktur konsisten dengan HistoryPage.
 */
export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    searchQuery,
    filter,
    setSearchQuery,
    setFilter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()

  const isFiltered = filter !== "all"
  const hasSearch  = searchQuery.trim().length > 0
  const isEmpty    = notifications.length === 0

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Header */}
      <NotificationHeader />

      {/* Search Bar + Filter + Mark All */}
      <NotificationSearchBar
        searchQuery={searchQuery}
        filter={filter}
        hasUnread={unreadCount > 0}
        onSearchChange={setSearchQuery}
        onFilterChange={setFilter}
        onMarkAllAsRead={markAllAsRead}
      />

      {/* Stats */}
      {!isLoading && notifications.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {notifications.length} notifikasi
            {isFiltered || hasSearch ? " (difilter)" : ""}
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-px text-xs font-semibold">
                {unreadCount} belum dibaca
              </span>
            )}
          </p>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        // Skeleton loading
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : isEmpty ? (
        <NotificationEmpty
          isFiltered={isFiltered}
          hasSearch={hasSearch}
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="flex flex-col gap-2.5">
            {notifications.map((notif, idx) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                animationIndex={idx}
                onMarkRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
