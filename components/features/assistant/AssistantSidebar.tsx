"use client"

import { useState } from "react"
import { Plus, Search, MoreVertical, Edit, Trash2, MessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { id as localeId } from "date-fns/locale"

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
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStartRename = (chat: Chat) => {
    setEditingChatId(chat.id)
    setEditTitle(chat.title)
  }

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim())
    }
    setEditingChatId(null)
  }

  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return formatDistanceToNow(date, { addSuffix: true, locale: localeId })
    } catch {
      return "baru saja"
    }
  }

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-full md:w-80 shrink-0">
      {/* New Conversation Button */}
      <div className="p-4 border-b border-sidebar-border">
        <Button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl py-5"
        >
          <Plus className="h-5 w-5" />
          <span>New Conversation</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="relative flex items-center bg-background rounded-xl border border-input focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Recent Conversations Title */}
      <div className="px-4 pt-4 pb-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Conversations
        </h4>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5 custom-scrollbar">
        {loadingChats ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Loading history...</span>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground">
            {searchQuery ? "Tidak ditemukan hasil" : "Belum ada percakapan"}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId
            const isEditing = chat.id === editingChatId

            return (
              <div
                key={chat.id}
                className={`group relative flex flex-col gap-1 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? "bg-sidebar-accent/80 border-sidebar-border text-sidebar-accent-foreground shadow-sm"
                    : "bg-transparent border-transparent hover:bg-sidebar-accent/40 text-sidebar-foreground"
                }`}
                onClick={() => !isEditing && onSelectChat(chat.id)}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleSaveRename(chat.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(chat.id)
                        if (e.key === "Escape") setEditingChatId(null)
                      }}
                      autoFocus
                      className="flex-1 bg-background border border-input rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2 pr-6">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-semibold text-sm truncate max-w-[180px]">
                        {chat.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 shrink-0" />
                        {getRelativeTime(chat.created_at)}
                      </span>
                    </div>

                    {/* Actions Menu */}
                    <div
                      className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 bg-card border-border">
                          <DropdownMenuItem
                            onClick={() => handleStartRename(chat)}
                            className="flex items-center gap-2 text-xs"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit Judul</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteChat(chat.id)}
                            className="flex items-center gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Hapus</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
