"use client"

import { useEffect, useState } from "react"
import { AssistantSidebar } from "@/components/features/assistant/AssistantSidebar"
import { AssistantChatArea } from "@/components/features/assistant/AssistantChatArea"
import { Menu, X } from "lucide-react"
import Swal from "sweetalert2"

interface Chat {
  id: string
  title: string
  created_at: string
}

export function AssistantClient() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [loadingChats, setLoadingChats] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const fetchConversations = async () => {
    try {
      setLoadingChats(true)
      const res = await fetch("/api/assistant/conversations")
      if (res.ok) {
        const data = await res.json()
        setChats(data)
        if (data.length > 0 && !activeChatId) {
          setActiveChatId(data[0].id)
        }
      }
    } catch (e) {
      console.error("Failed to load conversations:", e)
    } finally {
      setLoadingChats(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNewChat = () => {
    setActiveChatId(null)
    setMobileSidebarOpen(false)
  }

  const handleNewConversationNeeded = async (firstMessage: string) => {
    try {
      const res = await fetch("/api/assistant/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: firstMessage }),
      })
      if (res.ok) {
        const newChat = await res.json()
        setChats((prev) => [newChat, ...prev])
        setActiveChatId(newChat.id)
        return newChat.id
      }
    } catch (e) {
      console.error("Error creating conversation:", e)
    }
    return ""
  }

  const handleRenameChat = async (id: string, newTitle: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)))
    try {
      const res = await fetch(`/api/assistant/conversations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      })
      if (!res.ok) {
        fetchConversations()
      }
    } catch (e) {
      console.error("Failed to rename conversation:", e)
      fetchConversations()
    }
  }

  const handleDeleteChat = async (id: string) => {
    const isDark = document.documentElement.classList.contains("dark")
    const result = await Swal.fire({
      title: "Hapus Percakapan?",
      text: "Seluruh riwayat pesan di percakapan ini akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      background: isDark ? "#0d1221" : "#ffffff",
      color: isDark ? "#f3f4f6" : "#1f2937",
      customClass: {
        popup: "rounded-2xl border border-border shadow-2xl",
      }
    })

    if (!result.isConfirmed) return

    setChats((prev) => prev.filter((c) => c.id !== id))
    if (activeChatId === id) setActiveChatId(null)

    try {
      await fetch(`/api/assistant/conversations/${id}`, { method: "DELETE" })
    } catch (e) {
      console.error("Failed to delete:", e)
    }
  }

  return (
    <div className="relative flex h-[calc(100vh-6rem)] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-72 xl:w-80 shrink-0 border-r border-border overflow-hidden">
        <AssistantSidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={handleNewChat}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
          loadingChats={loadingChats}
        />
      </div>

      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="md:hidden absolute left-4 top-4 z-20 p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile Sidebar Portal */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/70 backdrop-blur-sm z-[100] md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border z-[101] md:hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border shrink-0 h-14">
              <span className="font-bold text-sm text-sidebar-foreground">Percakapan Saya</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AssistantSidebar
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={(id) => { setActiveChatId(id); setMobileSidebarOpen(false) }}
                onNewChat={handleNewChat}
                onRenameChat={handleRenameChat}
                onDeleteChat={handleDeleteChat}
                loadingChats={loadingChats}
              />
            </div>
          </div>
        </>
      )}

      {/* Chat Area */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <AssistantChatArea
          chatId={activeChatId}
          onNewConversationNeeded={handleNewConversationNeeded}
        />
      </div>
    </div>
  )
}
