"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { Send, Bot, Sparkles, Square, ChevronDown, Paperclip, X, FileText, Image as ImageIcon, PlusCircle, AlertCircle, Loader2 } from "lucide-react"
import { useChat } from "ai/react"
import type { Message } from "ai/react"
import { Button } from "@/components/ui"
import { convertToWorkspace } from "@/app/(main)/assistant/actions"
import Swal from "sweetalert2"
import { useRouter } from "next/navigation"

interface AssistantChatAreaProps {
  chatId: string | null
  chats: any[]
  setChats: React.Dispatch<React.SetStateAction<any[]>>
  onNewConversationNeeded: (firstMessage: string) => Promise<string>
}

// ─── Inline Message Formatter ────────────────────────────────────────────────
function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>
    }
    return part.replace(/\*/g, "")
  })
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === "") {
      elements.push(<div key={i} className="h-2" />)
      i++
      continue
    }

    // Numbered lists
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/)
    if (numMatch) {
      elements.push(
        <div key={i} className="flex gap-2 leading-relaxed ml-1">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
            {numMatch[1]}
          </span>
          <span className="flex-1">{parseInline(numMatch[2])}</span>
        </div>
      )
      i++
      continue
    }

    // Dash bullets
    const bulletMatch = trimmed.match(/^[-•]\s+(.+)/)
    if (bulletMatch) {
      elements.push(
        <div key={i} className="flex gap-2 leading-relaxed ml-2">
          <span className="flex-shrink-0 text-primary mt-1">•</span>
          <span className="flex-1">{parseInline(bulletMatch[1])}</span>
        </div>
      )
      i++
      continue
    }

    // Paragraph
    elements.push(
      <p key={i} className="leading-relaxed">
        {parseInline(trimmed)}
      </p>
    )
    i++
  }

  return <div className="flex flex-col gap-1.5 text-sm">{elements}</div>
}

export function AssistantChatArea({
  chatId,
  chats,
  setChats,
  onNewConversationNeeded,
}: AssistantChatAreaProps) {
  const router = useRouter()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Attachment states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<Array<{ name: string; type: string; url: string; base64: string }>>([])
  
  // Track last uploaded PDF for Workspace conversion
  const [lastPdf, setLastPdf] = useState<{ name: string; base64: string } | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  // 1. Vercel AI SDK useChat
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalSubmit,
    isLoading,
    stop,
    setMessages,
  } = useChat({
    api: "/api/assistant/chat",
    initialMessages: [],
    onError: (err) => {
      const msg = err.message ?? ""
      if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
        setErrorMsg("Aiden lagi kena rate limit nih, coba lagi beberapa saat ya 🙏")
      } else {
        setErrorMsg("Waduh ada error, coba tanya lagi ya 😅")
      }
    },
    onFinish: async (msg) => {
      setErrorMsg(null)
      // Save assistant response to DB
      if (chatId) {
        await saveMessageToDb(chatId, "assistant", msg.content)
      }
    },
  })

  // 2. Load message history when chatId changes
  useEffect(() => {
    if (!chatId) {
      setMessages([])
      setLastPdf(null)
      return
    }

    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/assistant/messages?chatId=${chatId}`)
        if (res.ok) {
          const dbMessages = await res.json()
          const formatted = dbMessages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: new Date(m.created_at),
          }))
          setMessages(formatted)

          // Try to scan for attached PDF mentions in history to enable workspace button
          const pdfMsg = dbMessages.find((m: any) => m.content.includes("[PDF Dilampirkan:"))
          if (pdfMsg) {
            const match = pdfMsg.content.match(/\[PDF Dilampirkan:\s*([^\]]+)\]/)
            if (match) {
              // We enable workspace converter trigger but note that we'd need base64. 
              // We'll instruct the user they can convert if they recently uploaded.
            }
          }
        }
      } catch (err) {
        console.error("Error loading chat history:", err)
      }
    }

    loadHistory()
  }, [chatId, setMessages])

  // Helper to persist message to DB
  const saveMessageToDb = async (cId: string, role: string, content: string) => {
    try {
      await fetch("/api/assistant/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: cId, role, content }),
      })
    } catch (e) {
      console.error("Failed to save message to database:", e)
    }
  }

  // 3. Smart scrolling
  const scrollToBottom = useCallback((force = false) => {
    const el = scrollAreaRef.current
    if (!el) return
    if (force || isAtBottom) {
      el.scrollTop = el.scrollHeight
    }
  }, [isAtBottom])

  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const atBottom = distanceFromBottom < 80
    setIsAtBottom(atBottom)
    setShowScrollBtn(!atBottom)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // 4. File attachments handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          title: "File Terlalu Besar",
          text: `Ukuran maksimal file adalah 10MB. File "${file.name}" ditolak.`,
          icon: "warning",
          confirmButtonColor: "var(--primary)",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setPreviews((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            url: base64String,
            base64: base64String.split(",")[1] || base64String,
          },
        ])
        setSelectedFiles((prev) => [...prev, file])

        // Keep track of the last PDF for workspace conversion
        if (file.type === "application/pdf") {
          setLastPdf({
            name: file.name,
            base64: base64String.split(",")[1] || base64String,
          })
        }
      }
      reader.readAsDataURL(file)
    })

    // Reset input value to allow selecting same file again
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeAttachment = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // 5. Submit Message Form
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() && selectedFiles.length === 0) return

    setIsAtBottom(true)
    setShowScrollBtn(false)
    setErrorMsg(null)

    let activeChatId = chatId
    let currentInput = input

    // If there is no active chat session, request a new conversation creation
    if (!activeChatId) {
      const displayTitle = currentInput.trim().substring(0, 30) || "Percakapan Baru"
      activeChatId = await onNewConversationNeeded(displayTitle)
    }

    if (!activeChatId) {
      setErrorMsg("Gagal menginisialisasi percakapan.")
      return
    }

    // Build the attachment display text
    let dbContent = currentInput
    if (previews.length > 0) {
      const attachmentsText = previews
        .map((p) => (p.type === "application/pdf" ? `[PDF Dilampirkan: ${p.name}]` : `[Gambar Dilampirkan: ${p.name}]`))
        .join(" ")
      dbContent = `${attachmentsText} ${currentInput}`.trim()
    }

    // Save user message to database
    await saveMessageToDb(activeChatId, "user", dbContent)

    // Submitting message with attachments via Vercel AI SDK
    const dataTransfer = new DataTransfer()
    selectedFiles.forEach((file) => dataTransfer.items.add(file))
    const fileList = dataTransfer.files

    originalSubmit(e, {
      experimental_attachments: fileList,
    })

    // Clear local attachment states
    setSelectedFiles([])
    setPreviews([])
  }

  // 6. Convert to Workspace Handler
  const handleCreateWorkspace = async () => {
    if (!lastPdf || !chatId) return

    const { value: formValues } = await Swal.fire({
      title: "Buat Workspace Baru",
      html:
        `<input id="swal-title" class="swal2-input" placeholder="Nama Workspace" value="${lastPdf.name.replace(".pdf", "")}">` +
        `<input id="swal-desc" class="swal2-input" placeholder="Deskripsi (Opsional)">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Buat Workspace 🚀",
      cancelButtonText: "Batal",
      confirmButtonColor: "var(--primary)",
      preConfirm: () => {
        const titleInput = (document.getElementById("swal-title") as HTMLInputElement).value
        const descInput = (document.getElementById("swal-desc") as HTMLInputElement).value
        if (!titleInput.trim()) {
          Swal.showValidationMessage("Nama Workspace wajib diisi")
        }
        return { title: titleInput, description: descInput }
      },
    })

    if (!formValues) return

    setIsConverting(true)
    Swal.fire({
      title: "Membuat Workspace...",
      text: "Sedang mengunggah berkas PDF dan memindahkan riwayat obrolan Anda.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    const result = await convertToWorkspace({
      chatId,
      title: formValues.title,
      description: formValues.description,
      fileName: lastPdf.name,
      fileBase64: lastPdf.base64,
    })

    setIsConverting(false)
    Swal.close()

    if (result.error) {
      Swal.fire({
        title: "Gagal membuat Workspace",
        text: result.error,
        icon: "error",
        confirmButtonColor: "var(--primary)",
      })
    } else if (result.success && result.workspaceId) {
      Swal.fire({
        title: "Workspace Berhasil Dibuat!",
        text: "Kamu akan langsung dialihkan ke workspace barumu.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      })
      router.push(`/workspaces/${result.workspaceId}`)
    }
  }

  const lastMsg = messages[messages.length - 1]
  const isWaitingForFirstToken = isLoading && lastMsg?.role === "user"

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 h-16 border-b border-border bg-card/60 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-4.5 w-4.5 text-primary" />
            {isLoading && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-ping" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">AiDen Global Assistant</h3>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? "bg-amber-400 animate-pulse" : "bg-green-500 animate-pulse"}`} />
              <span className="text-muted-foreground font-semibold">
                {isLoading ? "Aiden sedang mengetik..." : "Aiden Online"}
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Redirect Action Trigger */}
        {lastPdf && (
          <Button
            size="sm"
            onClick={handleCreateWorkspace}
            disabled={isConverting}
            className="flex items-center gap-1.5 text-xs bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 py-1.5 px-3 rounded-lg"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Buat Workspace</span>
            <span className="sm:hidden">Workspace</span>
          </Button>
        )}
      </div>

      {/* PDF Active Indicator / Tooltip Banner */}
      {lastPdf && (
        <div className="bg-primary/5 border-b border-primary/20 px-5 py-2.5 flex items-center justify-between text-xs text-primary gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">
              Aiden mendeteksi PDF: <strong>{lastPdf.name}</strong>. Kamu bisa mengonversi ini menjadi Workspace belajar.
            </span>
          </div>
          <button
            onClick={handleCreateWorkspace}
            className="underline font-bold hover:text-primary/80 shrink-0"
          >
            Buat Sekarang
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="relative flex-1 min-h-0 bg-background/50">
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto w-full h-full py-12">
              <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mb-5 border border-primary/10">
                <Bot className="h-7 w-7 text-primary/50" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Hai! Gue Aiden 👋</h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-md">
                Temen belajar virtual lu yang siap nemenin belajar apa aja. Lu bisa tanya materi umum, unggah gambar, atau kirim PDF.
              </p>
              <p className="text-xs text-muted-foreground">
                Gunakan tombol paperclip (<Paperclip className="h-3 w-3 inline" />) untuk melampirkan berkas.
              </p>
            </div>
          ) : (
            <>
              {messages.map((m: Message, index: number) => {
                const isUser = m.role === "user"
                return (
                  <div
                    key={m.id ?? index}
                    className={`flex gap-3 w-fit max-w-[88%] ${isUser ? "ml-auto flex-row-reverse" : ""}`}
                  >
                    {!isUser && (
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        isUser
                          ? "bg-primary text-primary-foreground rounded-tr-sm text-sm leading-relaxed"
                          : "bg-card text-foreground rounded-tl-sm border border-border shadow-sm"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <MessageContent content={m.content} />
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Waiting first token indicator */}
              {isWaitingForFirstToken && (
                <div className="flex gap-3 w-fit">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border flex items-center gap-2">
                    <span className="text-xs text-muted-foreground italic">Aiden sedang berpikir</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              )}

              {/* Error Box */}
              {errorMsg && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-2.5 w-fit">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="h-2" />
            </>
          )}
        </div>

        {/* Scroll button */}
        {showScrollBtn && (
          <button
            onClick={() => {
              scrollToBottom(true)
              setShowScrollBtn(false)
              setIsAtBottom(true)
            }}
            className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-all"
            title="Scroll ke bawah"
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Input Form & Preview */}
      <div className="flex-shrink-0 px-4 py-3 bg-background border-t border-border">
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 max-w-4xl mx-auto">
            {previews.map((preview, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-muted/60 border border-border px-3 py-1.5 rounded-xl text-xs relative max-w-[200px]"
              >
                {preview.type.startsWith("image/") ? (
                  <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                )}
                <span className="truncate flex-1 font-medium">{preview.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="p-0.5 rounded-full bg-background hover:bg-muted border border-border text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="relative flex items-center gap-2 max-w-4xl mx-auto w-full">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf,image/*"
            multiple
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-3 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-border"
            title="Attach file (PDF / Image)"
            disabled={isLoading}
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <input
            value={input}
            onChange={handleInputChange}
            placeholder={
              !chatId
                ? "Tulis pesan awal untuk memulai obrolan..."
                : "Ask AiDen anything..."
            }
            className="flex-1 h-11 pl-14 pr-14 rounded-full bg-muted/40 border border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all text-sm"
            disabled={isLoading}
          />

          {isLoading ? (
            <button
              type="button"
              onClick={() => stop()}
              className="absolute right-2 w-8 h-8 rounded-full bg-destructive flex items-center justify-center text-white hover:brightness-110 transition-all shadow-md"
              title="Hentikan Aiden"
            >
              <Square className="h-3 w-3 fill-white" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() && selectedFiles.length === 0}
              className="absolute right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          AIDEN INTELLIGENCE ENGINE · VERSION 2.0.4
        </p>
      </div>
    </div>
  )
}
