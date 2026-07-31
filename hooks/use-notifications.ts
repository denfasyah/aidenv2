"use client"

import { useState, useEffect, useCallback, useRef } from "react"

// ── Types ──────────────────────────────────────────────────────────────────────
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export type NotificationFilter = "all" | "unread" | "read"

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  searchQuery: string
  filter: NotificationFilter
  setSearchQuery: (q: string) => void
  setFilter: (f: NotificationFilter) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const POLL_INTERVAL_MS = 30_000 // 30 detik

/**
 * Hook untuk mengelola state notifikasi.
 * Menangani: fetch, polling, search, filter, mark read, delete.
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [isLoading, setIsLoading]         = useState(true)
  const [searchQuery, setSearchQuery]     = useState("")
  const [filter, setFilter]               = useState<NotificationFilter>("all")

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Fetch dari API ──────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams({ filter })
      if (searchQuery) params.set("q", searchQuery)

      const res = await fetch(`/api/notifications?${params.toString()}`)
      if (!res.ok) return

      const { notifications: data, unreadCount: count } = await res.json()
      setNotifications(data ?? [])
      setUnreadCount(count ?? 0)
    } catch (err) {
      console.error("useNotifications fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [filter, searchQuery])

  // ── Polling & refetch saat filter/search berubah ───────────────────────────
  useEffect(() => {
    setIsLoading(true)
    fetchNotifications()

    // Polling setiap 30 detik agar badge selalu fresh
    intervalRef.current = setInterval(() => {
      fetchNotifications()
    }, POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchNotifications])

  // ── Debounce search agar tidak spam request saat mengetik ─────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSetSearchQuery = useCallback((q: string) => {
    setSearchQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      // fetchNotifications dipanggil otomatis via dependency di useEffect atas
    }, 300)
  }, [])

  // ── Aksi: Mark Single as Read ──────────────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" })
    } catch (err) {
      console.error("markAsRead error:", err)
      // Revert on failure
      await fetchNotifications()
    }
  }, [fetchNotifications])

  // ── Aksi: Mark All as Read ─────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)

    try {
      await fetch("/api/notifications", { method: "PATCH" })
    } catch (err) {
      console.error("markAllAsRead error:", err)
      await fetchNotifications()
    }
  }, [fetchNotifications])

  // ── Aksi: Delete ───────────────────────────────────────────────────────────
  const deleteNotification = useCallback(async (id: string) => {
    const target = notifications.find((n) => n.id === id)

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (target && !target.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" })
    } catch (err) {
      console.error("deleteNotification error:", err)
      await fetchNotifications()
    }
  }, [notifications, fetchNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    searchQuery,
    filter,
    setSearchQuery: handleSetSearchQuery,
    setFilter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  }
}

// ── Lightweight hook khusus untuk badge di navbar ────────────────────────────
/**
 * Hook ringan yang hanya mengambil unreadCount — dipakai di TopNavbar.
 * Tidak mempengaruhi state halaman notifikasi.
 */
export function useUnreadNotificationCount(): number {
  const [count, setCount] = useState(0)
  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?filter=unread")
      if (!res.ok) return
      const { unreadCount } = await res.json()
      setCount(unreadCount ?? 0)
    } catch {
      // silent fail — badge tidak perlu crash halaman
    }
  }, [])

  useEffect(() => {
    fetch_()
    intervalRef.current = setInterval(fetch_, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetch_])

  return count
}
