"use client"

import { useState } from "react"
import {
  Plus, Search, Trash, MessageSquare, AlertTriangle
} from "lucide-react"

interface Chat {
  id: string
  title: string
  created_at: string
}

interface AssistantSidebarProps {
  chats: Chat[]
  activeChatId: string | null
  onSelectChat: (id: string) => void
  onNewChat: () => void
  onRenameChat: (id: string, newTitle: string) => void
  onDeleteChat: (id: string) => void
  loadingChats: boolean
}

function ChatSkeleton() {
  return (
    <div className="p-3.5 rounded-xl border border-transparent animate-pulse space-y-2">
      <div className="h-3.5 bg-muted rounded w-3/4" />
      <div className="h-2.5 bg-muted/60 rounded w-1/2" />
    </div>
  )
}



// ─── Custom Delete Confirm Modal ─────────────────────────────────────────────
function DeleteModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border shadow-2xl p-6"
        style={{ backgroundColor: "hsl(var(--card-bg))", color: "hsl(var(--foreground))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 w-9 h-9 rounded-full bg-destructive/15 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <h3 className="text-base font-bold mb-1">Hapus Percakapan?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Seluruh riwayat pesan di percakapan ini akan dihapus permanen dan tidak bisa dipulihkan.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border cursor-pointer transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "hsl(var(--muted))",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "hsl(var(--destructive))",
              color: "#ffffff",
            }}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Sidebar Component ──────────────────────────────────────────────────
export function AssistantSidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  loadingChats,
}: AssistantSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const filtered = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return
    onDeleteChat(deleteTargetId)
    setDeleteTargetId(null)
  }

  const relativeTime = (dateStr: string): string => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime()
      const minutes = Math.floor(diff / 60000)
      if (minutes < 1) return "baru saja"
      if (minutes < 60) return `${minutes} menit lalu`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours} jam lalu`
      const days = Math.floor(hours / 24)
      if (days < 7) return `${days} hari lalu`
      const weeks = Math.floor(days / 7)
      return `${weeks} minggu lalu`
    } catch {
      return "baru saja"
    }
  }

  return (
    <>
      <div className="flex flex-col h-full bg-sidebar w-full">
        {/* New Conversation */}
        <div className="p-4 shrink-0 border-b border-sidebar-border">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl py-2.5 text-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 shrink-0 border-b border-sidebar-border">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background/60 border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Section label */}
        <div className="px-4 pt-3 pb-1 shrink-0">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Recent Conversations
          </span>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 flex flex-col gap-2 custom-scrollbar">
          {loadingChats ? (
            <>
              {[...Array(4)].map((_, i) => <ChatSkeleton key={i} />)}
            </>
          ) : filtered.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">
              {searchQuery ? "Tidak ada hasil" : "Belum ada percakapan"}
            </p>
          ) : (
            filtered.map((chat) => {
              const isActive = chat.id === activeChatId

              return (
                <div
                  key={chat.id}
                  className={`group relative rounded-xl border cursor-pointer transition-all duration-150 ${
                    isActive
                      ? "bg-sidebar-accent border-sidebar-accent text-sidebar-accent-foreground"
                      : "border-transparent hover:bg-sidebar-accent/40 text-sidebar-foreground"
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="px-3 py-3.5 pr-10">
                    <p className="font-medium text-xs leading-snug truncate">{chat.title}</p>
                    <span className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                      <MessageSquare className="h-2.5 w-2.5 shrink-0" />
                      {relativeTime(chat.created_at)}
                    </span>
                  </div>

                  {/* Delete button — visible on hover or when active */}
                  <div
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 transition-opacity ${
                      isActive ? "opacity-60" : "opacity-0 group-hover:opacity-50"
                    } hover:!opacity-100`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setDeleteTargetId(chat.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isActive
                          ? "hover:bg-destructive/20 text-destructive/70 hover:text-destructive"
                          : "hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
                      }`}
                      title="Hapus percakapan"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteTargetId && (
        <DeleteModal
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTargetId(null)}
        />
      )}
    </>
  )
}
