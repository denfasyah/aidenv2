"use client"

import { useEffect, useState } from "react"
import { AssistantSidebar } from "@/components/features/assistant/AssistantSidebar"
import { AssistantChatArea } from "@/components/features/assistant/AssistantChatArea"
import { Menu, X, ArrowLeft } from "lucide-react"
import Swal from "sweetalert2"
import Link from "next/link"

interface Chat {
  id: string
  title: string
  created_at: string
}

export default function AssistantPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [loadingChats, setLoadingChats] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Fetch recent conversations on load
  const fetchConversations = async () => {
    try {
      setLoadingChats(true)
      const res = await fetch("/api/assistant/conversations")
      if (res.ok) {
        const data = await res.json()
        setChats(data)
        // Auto select the first chat if there are any and no chat is selected
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

  // Start new conversation by resetting activeChatId
  const handleNewChat = () => {
    setActiveChatId(null)
    setMobileSidebarOpen(false)
  }

  // Create new conversation on demand (first message sent)
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
      console.error("Error creating conversation on message:", e)
    }
    return ""
  }

  // Rename a conversation
  const handleRenameChat = async (id: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/assistant/conversations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      })

      if (res.ok) {
        const updated = await res.json()
        setChats((prev) => prev.map((c) => (c.id === id ? updated : c)))
      }
    } catch (e) {
      console.error("Failed to rename conversation:", e)
    }
  }

  // Delete a conversation
  const handleDeleteChat = async (id: string) => {
    const result = await Swal.fire({
      title: "Hapus Percakapan?",
      text: "Seluruh riwayat pesan di percakapan ini akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`/api/assistant/conversations/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setChats((prev) => prev.filter((c) => c.id !== id))
        if (activeChatId === id) {
          setActiveChatId(null)
        }
        Swal.fire({
          title: "Terhapus!",
          text: "Percakapan berhasil dihapus.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        })
      }
    } catch (e) {
      console.error("Failed to delete conversation:", e)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden relative rounded-2xl border border-border bg-card shadow-sm">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
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

      {/* Mobile Hamburger Trigger / Toggle Drawer */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="md:hidden absolute left-4 top-4.5 z-20 p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile Sliding Sidebar Drawer */}
      {mobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Drawer container */}
          <div className="fixed top-0 left-0 bottom-0 w-80 bg-sidebar border-r border-sidebar-border z-50 md:hidden flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border shrink-0">
              <span className="font-bold text-sm text-foreground">Percakapan Saya</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AssistantSidebar
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={(id) => {
                  setActiveChatId(id)
                  setMobileSidebarOpen(false)
                }}
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
      <div className="flex-1 h-full min-w-0">
        <AssistantChatArea
          chatId={activeChatId}
          chats={chats}
          setChats={setChats}
          onNewConversationNeeded={handleNewConversationNeeded}
        />
      </div>
    </div>
  )
}
