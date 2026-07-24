"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import {
  Send, Bot, Sparkles, Square, ChevronDown,
  Paperclip, X, FileText, Image as ImageIcon,
  PlusCircle, AlertCircle,
} from "lucide-react"
import { useChat } from "ai/react"
import type { Message } from "ai/react"
import { convertToWorkspace } from "@/app/(main)/assistant/actions"
import Swal from "sweetalert2"
import { useRouter } from "next/navigation"

interface AssistantChatAreaProps {
  chatId: string | null
  setChats: React.Dispatch<React.SetStateAction<any[]>>
  onNewConversationNeeded: (firstMessage: string) => Promise<string>
}

// ─── Threshold: offer workspace after this many back-and-forth messages ──────
const WORKSPACE_OFFER_AFTER_MESSAGES = 4

// ─── Attachment metadata embedded in message content ─────────────────────────
const ATTACH_PATTERN = /\[(PDF|Gambar) Dilampirkan: ([^\]]+)\]/g

function extractAttachments(content: string) {
  const results: Array<{ type: "PDF" | "Gambar"; name: string }> = []
  let m
  const re = new RegExp(ATTACH_PATTERN.source, "g")
  while ((m = re.exec(content)) !== null) {
    results.push({ type: m[1] as "PDF" | "Gambar", name: m[2] })
  }
  return results
}

function stripAttachmentTags(content: string) {
  return content.replace(new RegExp(ATTACH_PATTERN.source, "g"), "").trim()
}

// ─── Attachment chips rendered inside a message bubble ───────────────────────
function AttachmentChips({ content }: { content: string }) {
  const items = extractAttachments(content)
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 bg-white/10 dark:bg-white/10 backdrop-blur rounded-lg px-2.5 py-1.5 text-[11px] font-medium border border-white/20 max-w-[220px]"
        >
          {item.type === "PDF"
            ? <FileText className="h-3.5 w-3.5 shrink-0 opacity-80" />
            : <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />}
          <span className="truncate">{item.name}</span>
          <span className="shrink-0 text-[9px] opacity-60 uppercase tracking-wider ml-0.5">{item.type}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Inline markdown renderer ─────────────────────────────────────────────────
function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return part.replace(/\*/g, "")
  })
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n")
  const els: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const trimmed = lines[i].trim()
    if (!trimmed) { els.push(<div key={i} className="h-2" />); i++; continue }
    const num = trimmed.match(/^(\d+)[.)]\s+(.+)/)
    if (num) {
      els.push(
        <div key={i} className="flex gap-2 leading-relaxed">
          <span className="shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">{num[1]}</span>
          <span className="flex-1">{parseInline(num[2])}</span>
        </div>
      )
      i++; continue
    }
    const bullet = trimmed.match(/^[-•]\s+(.+)/)
    if (bullet) {
      els.push(
        <div key={i} className="flex gap-2 leading-relaxed">
          <span className="shrink-0 text-primary mt-1 text-xs">•</span>
          <span className="flex-1">{parseInline(bullet[1])}</span>
        </div>
      )
      i++; continue
    }
    els.push(<p key={i} className="leading-relaxed">{parseInline(trimmed)}</p>)
    i++
  }
  return <div className="flex flex-col gap-1.5 text-sm">{els}</div>
}

// ─── Skeleton loader while history is being fetched ──────────────────────────
function ChatHistorySkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "justify-end" : ""}`}>
          {i % 2 !== 0 && <div className="w-7 h-7 rounded-lg bg-muted shrink-0" />}
          <div className={`space-y-2 ${i % 2 === 0 ? "items-end flex flex-col" : ""}`}>
            <div className={`h-4 bg-muted rounded-xl ${i % 2 === 0 ? "w-40" : "w-56"}`} />
            <div className={`h-4 bg-muted/60 rounded-xl ${i % 2 === 0 ? "w-28" : "w-72"}`} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function AssistantChatArea({
  chatId,
  setChats,
  onNewConversationNeeded,
}: AssistantChatAreaProps) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatIdRef = useRef<string | null>(chatId)
  const userScrolledUpRef = useRef(false)

  useEffect(() => { chatIdRef.current = chatId }, [chatId])

  const [historyLoading, setHistoryLoading] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Attachment staging
  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const [stagedPreviews, setStagedPreviews] = useState<Array<{ name: string; type: string; dataUrl: string; base64: string }>>([])

  // Last PDF seen in THIS session (for workspace offer)
  const [sessionPdf, setSessionPdf] = useState<{ name: string; base64: string } | null>(null)
  // Whether user has discussed PDF enough to show workspace offer
  const [showWorkspaceOffer, setShowWorkspaceOffer] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  // ── AI Chat SDK ─────────────────────────────────────────────────────────────
  const { messages, input, handleInputChange, handleSubmit: sdkSubmit, isLoading, stop, setMessages } = useChat({
    api: "/api/assistant/chat",
    initialMessages: [],
    onError: (err) => {
      const msg = (err.message ?? "").toLowerCase()
      if (msg.includes("429") || msg.includes("rate limit") || msg.includes("quota")) {
        setErrorMsg("Aiden lagi overloaded, tunggu beberapa detik ya 🙏")
      } else {
        setErrorMsg("Waduh ada error nih, coba kirim lagi ya 😅")
      }
    },
    onFinish: async (msg) => {
      setErrorMsg(null)
      const id = chatIdRef.current
      if (id) await persistMessage(id, "assistant", msg.content)
    },
  })

  // ── Load history when chatId changes ────────────────────────────────────────
  useEffect(() => {
    if (!chatId) {
      setMessages([])
      setSessionPdf(null)
      setShowWorkspaceOffer(false)
      userScrolledUpRef.current = false
      return
    }
    setHistoryLoading(true)
    userScrolledUpRef.current = false
    fetch(`/api/assistant/messages?chatId=${chatId}`)
      .then(async (res) => {
        if (!res.ok) return
        const rows = await res.json()
        setMessages(
          rows.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: new Date(m.created_at),
          }))
        )
        // Restore workspace offer if PDF was discussed in this conversation
        const totalMessages = rows.length
        const hasPdf = rows.some((m: any) => m.content.includes("[PDF Dilampirkan:"))
        if (hasPdf && totalMessages >= WORKSPACE_OFFER_AFTER_MESSAGES) {
          setShowWorkspaceOffer(true)
        }
      })
      .catch((e) => console.error("History load error:", e))
      .finally(() => setHistoryLoading(false))
  }, [chatId, setMessages])

  // ── Check workspace offer trigger as messages grow ───────────────────────────
  useEffect(() => {
    const hasPdf = messages.some((m) => m.content.includes("[PDF Dilampirkan:"))
    if (hasPdf && messages.length >= WORKSPACE_OFFER_AFTER_MESSAGES) {
      setShowWorkspaceOffer(true)
    }
  }, [messages])

  // ── Persist message helper ───────────────────────────────────────────────────
  const persistMessage = async (cId: string, role: string, content: string) => {
    try {
      await fetch("/api/assistant/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: cId, role, content }),
      })
    } catch (e) {
      console.error("Failed to persist message:", e)
    }
  }

  // ── Smart scroll — only auto-scroll when user is at/near bottom ──────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    const atBottom = distance < 40
    setShowScrollBtn(!atBottom)
    userScrolledUpRef.current = !atBottom
  }, [])

  const scrollToBottom = useCallback((force = false) => {
    const el = scrollRef.current
    if (!el) return
    if (force || !userScrolledUpRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [])

  // Auto-scroll only if user hasn't manually scrolled up
  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // ── File staging ─────────────────────────────────────────────────────────────
  const openFilePicker = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          title: "File Terlalu Besar",
          text: `Maksimal 10MB. File "${file.name}" ditolak.`,
          icon: "warning",
          background: "hsl(var(--card))",
          color: "hsl(var(--foreground))",
          confirmButtonColor: "hsl(var(--primary))",
          customClass: { popup: "!rounded-2xl" },
        })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        const base64 = dataUrl.split(",")[1] ?? dataUrl
        setStagedPreviews((p) => [...p, { name: file.name, type: file.type, dataUrl, base64 }])
        setStagedFiles((p) => [...p, file])
        if (file.type === "application/pdf") {
          setSessionPdf({ name: file.name, base64 })
        }
      }
      reader.readAsDataURL(file)
    })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeStaged = (i: number) => {
    setStagedFiles((p) => p.filter((_, idx) => idx !== i))
    setStagedPreviews((p) => p.filter((_, idx) => idx !== i))
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() && stagedFiles.length === 0) return

    userScrolledUpRef.current = false
    setErrorMsg(null)

    // Ensure we have an active chat
    let activeChatId = chatIdRef.current
    if (!activeChatId) {
      const title = input.trim().slice(0, 40) || "Percakapan Baru"
      activeChatId = await onNewConversationNeeded(title)
      chatIdRef.current = activeChatId
    }
    if (!activeChatId) {
      setErrorMsg("Gagal membuat percakapan baru. Coba refresh halaman.")
      return
    }

    // Build DB content string (includes attachment tags)
    const tags = stagedPreviews.map((p) =>
      p.type === "application/pdf"
        ? `[PDF Dilampirkan: ${p.name}]`
        : `[Gambar Dilampirkan: ${p.name}]`
    )
    const dbContent = [...tags, input].filter(Boolean).join(" ")

    await persistMessage(activeChatId, "user", dbContent)

    // Build FileList for SDK
    const dt = new DataTransfer()
    stagedFiles.forEach((f) => dt.items.add(f))

    // Clear staging BEFORE submit so textarea doesn't re-fire
    setStagedFiles([])
    setStagedPreviews([])

    sdkSubmit(e, { experimental_attachments: dt.files })
  }

  // ── Convert to Workspace ─────────────────────────────────────────────────────
  const handleCreateWorkspace = async () => {
    if (!sessionPdf || !chatIdRef.current) return

    const { value } = await Swal.fire({
      title: "Buat Workspace dari PDF ini",
      html:
        `<input id="sw-title" class="swal2-input" placeholder="Nama Workspace" value="${sessionPdf.name.replace(/\.pdf$/i, "")}">` +
        `<input id="sw-desc" class="swal2-input" placeholder="Deskripsi (Opsional)">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Buat Workspace 🚀",
      cancelButtonText: "Nanti aja",
      background: "hsl(var(--card))",
      color: "hsl(var(--foreground))",
      confirmButtonColor: "hsl(var(--primary))",
      cancelButtonColor: "#6b7280",
      customClass: { popup: "!rounded-2xl" },
      preConfirm: () => {
        const t = (document.getElementById("sw-title") as HTMLInputElement)?.value
        const d = (document.getElementById("sw-desc") as HTMLInputElement)?.value
        if (!t?.trim()) { Swal.showValidationMessage("Nama Workspace wajib diisi"); return }
        return { title: t, description: d }
      },
    })

    if (!value) return
    setIsConverting(true)
    Swal.fire({
      title: "Memproses...",
      text: "Mengunggah PDF dan memindahkan riwayat chat.",
      allowOutsideClick: false,
      background: "hsl(var(--card))",
      color: "hsl(var(--foreground))",
      customClass: { popup: "!rounded-2xl" },
      didOpen: () => Swal.showLoading(),
    })

    const result = await convertToWorkspace({
      chatId: chatIdRef.current!,
      title: value.title,
      description: value.description,
      fileName: sessionPdf.name,
      fileBase64: sessionPdf.base64,
    })

    setIsConverting(false)
    Swal.close()

    if (result.error) {
      Swal.fire({
        title: "Gagal",
        text: result.error,
        icon: "error",
        background: "hsl(var(--card))",
        color: "hsl(var(--foreground))",
        confirmButtonColor: "hsl(var(--primary))",
        customClass: { popup: "!rounded-2xl" },
      })
    } else if (result.workspaceId) {
      Swal.fire({
        title: "Workspace Dibuat!",
        text: "Mengarahkan ke workspace baru...",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
        background: "hsl(var(--card))",
        color: "hsl(var(--foreground))",
        customClass: { popup: "!rounded-2xl" },
      })
      router.push(`/workspaces/${result.workspaceId}`)
    }
  }

  const waitingFirstToken = isLoading && messages[messages.length - 1]?.role === "user"

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 h-14 border-b border-border flex items-center justify-between px-4 bg-card/60 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Bot className="h-4 w-4 text-primary" />
            {isLoading && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-ping" />}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-none">AiDen Global Assistant</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                {isLoading ? "Aiden sedang mengetik..." : "Aiden Online"}
              </span>
            </div>
          </div>
        </div>

        {/* Workspace offer button */}
        {showWorkspaceOffer && sessionPdf && (
          <button
            onClick={handleCreateWorkspace}
            disabled={isConverting}
            className="shrink-0 flex items-center gap-1.5 text-xs bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 rounded-lg px-3 py-1.5 font-semibold transition-all disabled:opacity-50"
          >
            <PlusCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Buat Workspace</span>
            <span className="sm:hidden">Workspace</span>
          </button>
        )}
      </div>

      {/* ── Workspace offer banner (only after threshold) ───────────────────── */}
      {showWorkspaceOffer && sessionPdf && (
        <div className="shrink-0 flex items-center justify-between gap-2 bg-primary/8 border-b border-primary/15 px-4 py-2">
          <div className="flex items-center gap-2 min-w-0 text-xs text-primary">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0">
              Kamu udah banyak bahas <strong className="font-semibold">{sessionPdf.name}</strong>.
              Mau dijadiin Workspace belajar?
            </span>
          </div>
          <button
            onClick={handleCreateWorkspace}
            className="shrink-0 text-xs font-bold text-primary underline hover:no-underline whitespace-nowrap"
          >
            Buat Sekarang
          </button>
        </div>
      )}

      {/* ── Message list ────────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto custom-scrollbar"
        >
          {historyLoading ? (
            <ChatHistorySkeleton />
          ) : messages.length === 0 ? (
            // ── Empty state ─────────────────────────────────────────────────
            <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-5">
                <Bot className="h-8 w-8 text-primary/50" />
              </div>
              <h3 className="text-xl font-bold mb-2">Hai, gue Aiden 👋</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Temen belajar virtual lu. Tanya apa aja — materi umum, upload gambar, atau kirim PDF buat dibahas bareng.
              </p>
            </div>
          ) : (
            // ── Messages ────────────────────────────────────────────────────
            <div className="flex flex-col gap-4 p-5">
              {messages.map((m: Message, idx) => {
                const isUser = m.role === "user"
                const cleanContent = stripAttachmentTags(m.content)
                return (
                  <div
                    key={m.id ?? idx}
                    className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-0`}>
                      {/* Attachment chips on top of bubble */}
                      {isUser && extractAttachments(m.content).length > 0 && (
                        <div className={`flex flex-wrap gap-1.5 mb-1.5 ${isUser ? "justify-end" : ""}`}>
                          {extractAttachments(m.content).map((att, ai) => (
                            <div
                              key={ai}
                              className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 text-primary rounded-lg px-2.5 py-1.5 text-[11px] font-medium max-w-[220px]"
                            >
                              {att.type === "PDF"
                                ? <FileText className="h-3.5 w-3.5 shrink-0" />
                                : <ImageIcon className="h-3.5 w-3.5 shrink-0" />}
                              <span className="truncate">{att.name}</span>
                              <span className="shrink-0 text-[9px] opacity-70 uppercase tracking-wider">{att.type}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Message bubble — skip if only attachments and empty text */}
                      {cleanContent && (
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            isUser
                              ? "bg-primary text-primary-foreground rounded-tr-sm text-sm"
                              : "bg-card border border-border rounded-tl-sm shadow-sm"
                          }`}
                        >
                          {isUser
                            ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{cleanContent}</p>
                            : <MessageContent content={cleanContent} />}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Typing indicator */}
              {waitingFirstToken && (
                <div className="flex gap-3 justify-start">
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
                    <span className="text-xs text-muted-foreground italic">Aiden sedang berpikir</span>
                    <span className="flex gap-1">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}

              {/* Error */}
              {errorMsg && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-2.5 w-fit">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Bottom anchor */}
              <div className="h-1" />
            </div>
          )}
        </div>

        {/* Scroll-to-bottom button */}
        {showScrollBtn && (
          <button
            onClick={() => {
              userScrolledUpRef.current = false
              scrollToBottom(true)
            }}
            className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-card border border-border shadow-xl flex items-center justify-center hover:bg-muted transition-all"
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ── Input area ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-t border-border bg-background/95">
        {/* Staged attachment previews */}
        {stagedPreviews.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {stagedPreviews.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-muted/70 border border-border text-foreground rounded-lg px-2.5 py-1.5 text-xs font-medium max-w-[180px]"
              >
                {p.type.startsWith("image/")
                  ? <ImageIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  : <FileText className="h-3.5 w-3.5 text-primary shrink-0" />}
                <span className="truncate flex-1">{p.name}</span>
                <button
                  type="button"
                  onClick={() => removeStaged(i)}
                  className="shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
        />

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Paperclip — direct to file picker */}
          <button
            type="button"
            onClick={openFilePicker}
            disabled={isLoading}
            className="shrink-0 w-9 h-9 rounded-full bg-muted/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50"
            title="Lampirkan file (PDF / Gambar)"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Text input */}
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={chatId ? "Ask AiDen anything..." : "Tulis pesan pertama untuk memulai..."}
            disabled={isLoading}
            className="flex-1 h-10 px-4 rounded-full bg-muted/40 border border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm transition-all"
          />

          {/* Send / Stop */}
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="shrink-0 w-9 h-9 rounded-full bg-destructive flex items-center justify-center text-white hover:brightness-110 transition-all shadow-md"
              title="Hentikan"
            >
              <Square className="h-3.5 w-3.5 fill-white" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() && stagedFiles.length === 0}
              className="shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60 tracking-widest uppercase">
          Aiden Intelligence Engine · v2.0.4
        </p>
      </div>
    </div>
  )
}
