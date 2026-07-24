"use client"

import { useState } from "react"
import {
  Plus, Search, MoreVertical, Edit2, Trash2, MessageSquare, Check, X
} from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import Swal from "sweetalert2"

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

  const filtered = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEditTitle = async (chat: Chat) => {
    const isDark = document.documentElement.classList.contains("dark")
    const { value: newTitle } = await Swal.fire({
      title: "Ubah Judul Percakapan",
      input: "text",
      inputPlaceholder: "Masukkan judul baru...",
      inputValue: chat.title,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      buttonsStyling: false,
      background: isDark ? "#0d1221" : "#ffffff",
      color: isDark ? "#f3f4f6" : "#1f2937",
      customClass: {
        popup: "swal-popup-custom",
        actions: "swal-actions-row",
        confirmButton: "swal-btn-primary",
        cancelButton: "swal-btn-cancel",
        input: "!bg-transparent border-border text-foreground rounded-lg !shadow-none"
      },
      preConfirm: (value) => {
        if (!value || !value.trim()) {
          Swal.showValidationMessage("Judul tidak boleh kosong")
        }
        return value
      }
    })

    if (newTitle && newTitle.trim()) {
      onRenameChat(chat.id, newTitle.trim())
    }
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
      <div className="flex-1 overflow-y-auto px-2 pb-4 flex flex-col gap-1 custom-scrollbar">
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
                className={`group relative rounded-xl border transition-all duration-150 ${
                  isActive
                    ? "bg-sidebar-accent border-sidebar-accent text-sidebar-accent-foreground"
                    : "border-transparent hover:bg-sidebar-accent/40 text-sidebar-foreground cursor-pointer"
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="px-3 py-3 pr-9">
                  <p className="font-medium text-xs leading-snug truncate">{chat.title}</p>
                  <span className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                    <MessageSquare className="h-2.5 w-2.5 shrink-0" />
                    {relativeTime(chat.created_at)}
                  </span>
                </div>

                {/* Three-dots menu */}
                <div
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isActive
                            ? "text-sidebar-accent-foreground/70 hover:bg-white/10"
                            : "text-muted-foreground hover:bg-sidebar-accent/60"
                        }`}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      side="bottom"
                      sideOffset={4}
                      className="w-36 bg-popover border-border shadow-xl z-[200]"
                    >
                      <DropdownMenuItem
                        onClick={() => handleEditTitle(chat)}
                        className="flex items-center gap-2 text-xs cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit Judul
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteChat(chat.id)}
                        className="flex items-center gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
