"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import {
  Send, Bot, Sparkles, Square, ChevronDown,
  Paperclip, X, FileText, Image as ImageIcon,
  PlusCircle, AlertCircle, ExternalLink, Download
} from "lucide-react"
import { useChat } from "ai/react"
import type { Message } from "ai/react"
import { convertToWorkspace } from "@/app/(main)/assistant/actions"
import Swal from "sweetalert2"
import { useRouter } from "next/navigation"

interface AssistantChatAreaProps {
  chatId: string | null
  onNewConversationNeeded: (firstMessage: string) => Promise<string>
}

// ─── Threshold: offer workspace after this many back-and-forth messages ──────
const WORKSPACE_OFFER_AFTER_MESSAGES = 4

// ─── Attachment metadata embedded in message content ─────────────────────────
// Format: [File: name | type | url]
const ATTACH_PATTERN = /\[File:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]/g

interface FileAttachment {
  name: string
  type: string
  url: string
}

function extractAttachments(content: string): FileAttachment[] {
  const results: FileAttachment[] = []
  let m
  const re = new RegExp(ATTACH_PATTERN.source, "g")
  while ((m = re.exec(content)) !== null) {
    results.push({ name: m[1].trim(), type: m[2].trim(), url: m[3].trim() })
  }
  return results
}

function stripAttachmentTags(content: string) {
  return content.replace(new RegExp(ATTACH_PATTERN.source, "g"), "").trim()
}

// ─── Attachment chips rendered inside/below a message bubble ───────────────────
// Accepts both [File: ...] tags in content and experimental_attachments from useChat
function AttachmentChips({
  content,
  expAttachments,
}: {
  content: string
  expAttachments?: Array<{ name?: string; url: string; contentType?: string }>
}) {
  // Try [File: ...] tags first (DB-loaded messages)
  const tagItems = extractAttachments(content)

  // Fallback to experimental_attachments (live useChat messages before reload)
  const items: FileAttachment[] =
    tagItems.length > 0
      ? tagItems
      : (expAttachments?.map((a) => ({
          name: a.name || "File",
          type: a.contentType || "application/octet-stream",
          url: a.url,
        })) ?? [])

  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-2 mt-2 w-full">
      {items.map((item, i) => {
        const isImage = item.type.startsWith("image/")
        return (
          <div
            key={i}
            className="flex flex-col bg-muted/60 dark:bg-muted/30 border border-border rounded-xl overflow-hidden max-w-sm shadow-sm"
          >
            {isImage ? (
              <div className="relative group max-h-48 overflow-hidden bg-black/5 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.name}
                  className="object-cover max-h-48 w-full hover:scale-105 transition-transform duration-200"
                />
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white font-medium text-xs transition-opacity duration-200"
                >
                  <ExternalLink className="h-4 w-4" /> Buka Gambar
                </a>
              </div>
            ) : null}

            <div className="p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                {item.type === "application/pdf" ? (
                  <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate leading-snug">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    {item.type.split("/")[1] || "file"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg hover:bg-background border border-border text-muted-foreground hover:text-foreground transition-colors"
                  title="Buka File"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href={item.url}
                  download={item.name}
                  className="p-1.5 rounded-lg hover:bg-background border border-border text-muted-foreground hover:text-foreground transition-colors"
                  title="Unduh File"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Inline markdown renderer ─────────────────────────────────────────────────
function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-primary">{part.slice(2, -2)}</strong>
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
        <div key={i} className="flex gap-2 leading-relaxed mt-1">
          <span className="shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">{num[1]}</span>
          <span className="flex-1">{parseInline(num[2])}</span>
        </div>
      )
      i++; continue
    }
    const bullet = trimmed.match(/^[-•]\s+(.+)/)
    if (bullet) {
      els.push(
        <div key={i} className="flex gap-2 leading-relaxed mt-1">
          <span className="shrink-0 text-primary mt-1.5 text-xs">•</span>
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

export function AssistantChatArea({
  chatId,
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

  // Attachment uploading state
  const [stagingList, setStagingList] = useState<Array<{ name: string; type: string; url: string; base64: string }>>([])
  const [isUploading, setIsUploading] = useState(false)

  // PDF tracking for workspace
  const [sessionPdf, setSessionPdf] = useState<{ name: string; base64: string } | null>(null)
  const [showWorkspaceOffer, setShowWorkspaceOffer] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

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

  // Load history when chatId changes
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

        // Workspace trigger check
        const hasPdf = rows.some((m: any) => m.content.includes("[File: ") && m.content.includes("application/pdf"))
        if (hasPdf && rows.length >= WORKSPACE_OFFER_AFTER_MESSAGES) {
          // Find the last PDF base64 or path to rebuild sessionPdf if needed
          setShowWorkspaceOffer(true)
        }
      })
      .catch((e) => console.error("History load error:", e))
      .finally(() => setHistoryLoading(false))
  }, [chatId, setMessages])

  // Monitor message length for workspace trigger
  useEffect(() => {
    const hasPdf = messages.some((m) => m.content.includes("[File: ") && m.content.includes("application/pdf"))
    if (hasPdf && messages.length >= WORKSPACE_OFFER_AFTER_MESSAGES) {
      setShowWorkspaceOffer(true)
    }
  }, [messages])

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

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  const openFilePicker = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setIsUploading(true)
    const isDark = document.documentElement.classList.contains("dark")

    for (const file of files) {
      if (file.size > 15 * 1024 * 1024) {
        Swal.fire({
          title: "File Terlalu Besar",
          text: `Maksimal 15MB. File "${file.name}" ditolak.`,
          icon: "warning",
          background: isDark ? "#0d1221" : "#ffffff",
          color: isDark ? "#f3f4f6" : "#1f2937",
          confirmButtonColor: "var(--primary, #16a34a)",
          customClass: { popup: "rounded-2xl" },
        })
        continue
      }

      try {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/assistant/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) throw new Error(await res.text())

        const uploadResult = await res.json() // { url, name, type }

        // Read to base64 for Gemini parts & conversion
        const reader = new FileReader()
        reader.onloadend = () => {
          const dataUrl = reader.result as string
          const base64 = dataUrl.split(",")[1] ?? dataUrl

          setStagingList((prev) => [...prev, {
            name: uploadResult.name,
            type: uploadResult.type,
            url: uploadResult.url,
            base64
          }])

          if (uploadResult.type === "application/pdf") {
            setSessionPdf({ name: uploadResult.name, base64 })
          }
        }
        reader.readAsDataURL(file)

      } catch (err) {
        console.error("Upload error:", err)
        Swal.fire({
          title: "Gagal Mengunggah",
          text: `Gagal memuat file "${file.name}": ${err instanceof Error ? err.message : "Error"}`,
          icon: "error",
          background: isDark ? "#0d1221" : "#ffffff",
          color: isDark ? "#f3f4f6" : "#1f2937",
          confirmButtonColor: "var(--primary, #16a34a)",
          customClass: { popup: "rounded-2xl" },
        })
      }
    }
    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeStaged = (i: number) => {
    setStagingList((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() && stagingList.length === 0) return

    userScrolledUpRef.current = false
    setErrorMsg(null)

    let activeChatId = chatIdRef.current
    if (!activeChatId) {
      const title = input.trim().slice(0, 40) || (stagingList[0]?.name ? `File: ${stagingList[0].name}` : "Percakapan Baru")
      activeChatId = await onNewConversationNeeded(title)
      chatIdRef.current = activeChatId
    }
    if (!activeChatId) {
      setErrorMsg("Gagal membuat percakapan baru.")
      return
    }

    // Embed persistent file URL attachments in database message
    const tags = stagingList.map((p) => `[File: ${p.name} | ${p.type} | ${p.url}]`)
    const dbContent = [...tags, input].filter(Boolean).join(" ")

    await persistMessage(activeChatId, "user", dbContent)

    // Build attachments compatible with experimental_attachments
    const attachments = stagingList.map((p) => ({
      name: p.name,
      url: p.url,
      contentType: p.type,
    }))

    setStagingList([])
    sdkSubmit(e, { experimental_attachments: attachments as any })
  }

  const handleCreateWorkspace = async () => {
    if (!sessionPdf || !chatIdRef.current) return
    const isDark = document.documentElement.classList.contains("dark")

    const { value } = await Swal.fire({
      title: "Buat Workspace dari PDF ini",
      html:
        `<input id="sw-title" class="swal2-input" placeholder="Nama Workspace" value="${sessionPdf.name.replace(/\.pdf$/i, "")}">` +
        `<input id="sw-desc" class="swal2-input" placeholder="Deskripsi (Opsional)">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Buat Workspace 🚀",
      cancelButtonText: "Nanti aja",
      background: isDark ? "#0d1221" : "#ffffff",
      color: isDark ? "#f3f4f6" : "#1f2937",
      confirmButtonColor: "var(--primary, #16a34a)",
      cancelButtonColor: "#6b7280",
      customClass: { popup: "rounded-2xl" },
      preConfirm: () => {
        const t = (document.getElementById("sw-title") as HTMLInputElement)?.value
        const d = (document.getElementById("sw-desc") as HTMLInputElement)?.value
        if (!t?.trim()) { Swal.showValidationMessage("Nama Workspace wajib diisi") }
        return { title: t, description: d }
      },
    })

    if (!value) return
    setIsConverting(true)
    Swal.fire({
      title: "Memproses...",
      text: "Mengunggah PDF dan memindahkan riwayat chat.",
      allowOutsideClick: false,
      background: isDark ? "#0d1221" : "#ffffff",
      color: isDark ? "#f3f4f6" : "#1f2937",
      customClass: { popup: "rounded-2xl" },
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
        background: isDark ? "#0d1221" : "#ffffff",
        color: isDark ? "#f3f4f6" : "#1f2937",
        confirmButtonColor: "var(--primary, #16a34a)",
        customClass: { popup: "rounded-2xl" },
      })
    } else if (result.workspaceId) {
      Swal.fire({
        title: "Workspace Dibuat!",
        text: "Mengarahkan ke workspace baru...",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
        background: isDark ? "#0d1221" : "#ffffff",
        color: isDark ? "#f3f4f6" : "#1f2937",
        customClass: { popup: "rounded-2xl" },
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
            className="shrink-0 flex items-center gap-1.5 text-xs bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 rounded-lg px-3 py-1.5 font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Buat Workspace</span>
            <span className="sm:hidden">Workspace</span>
          </button>
        )}
      </div>

      {/* ── Workspace offer banner ───────────────────── */}
      {showWorkspaceOffer && sessionPdf && (
        <div className="shrink-0 flex items-center justify-between gap-2 bg-primary/8 border-b border-primary/15 px-4 py-2 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 min-w-0 text-xs text-primary">
            <FileText className="h-3.5 w-3.5 shrink-0 animate-bounce" />
            <span className="min-w-0">
              Kamu sudah banyak membahas <strong className="font-semibold">{sessionPdf.name}</strong>.
              Mau jadikan Workspace belajar khusus materi ini?
            </span>
          </div>
          <button
            onClick={handleCreateWorkspace}
            className="shrink-0 text-xs font-bold text-primary underline hover:no-underline whitespace-nowrap cursor-pointer"
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
            <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-5">
                <Bot className="h-8 w-8 text-primary/50" />
              </div>
              <h3 className="text-xl font-bold mb-2">Hai, gue Aiden 👋</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Temen belajar virtual lu. Tanya apa aja — materi umum, kirim file gambar untuk dianalisis, atau kirim PDF.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-5">
              {messages.map((m: Message, idx) => {
                const isUser = m.role === "user"
                const cleanContent = stripAttachmentTags(m.content)
                // Use experimental_attachments from useChat for live messages
                // (fallback when [File:...] tags aren't yet in content)
                const expAttachments = (m as any).experimental_attachments as
                  | Array<{ name?: string; url: string; contentType?: string }>
                  | undefined

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
                      {/* Attachments rendered ABOVE the text bubble for user messages (like ChatGPT) */}
                      {isUser && (
                        <AttachmentChips content={m.content} expAttachments={expAttachments} />
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          isUser
                            ? "bg-primary text-primary-foreground rounded-tr-sm text-sm"
                            : "bg-card border border-border rounded-tl-sm shadow-sm"
                        }`}
                      >
                        {cleanContent && (
                          <div className={isUser ? "whitespace-pre-wrap text-sm leading-relaxed" : ""}>
                            {isUser ? cleanContent : <MessageContent content={cleanContent} />}
                          </div>
                        )}
                        {/* For assistant messages, attachments appear inside the bubble */}
                        {!isUser && (
                          <AttachmentChips content={m.content} expAttachments={expAttachments} />
                        )}
                      </div>
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
            className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-card border border-border shadow-xl flex items-center justify-center hover:bg-muted transition-all cursor-pointer"
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ── Input area ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-t border-border bg-background/95">
        {/* Upload previews staging */}
        {stagingList.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 animate-in fade-in duration-200">
            {stagingList.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-muted border border-border text-foreground rounded-lg px-2.5 py-1.5 text-xs font-medium max-w-[180px]"
              >
                {p.type.startsWith("image/") ? (
                  <ImageIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
                <span className="truncate flex-1">{p.name}</span>
                <button
                  type="button"
                  onClick={() => removeStaged(i)}
                  className="shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
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
          {/* Paperclip */}
          <button
            type="button"
            onClick={openFilePicker}
            disabled={isLoading || isUploading}
            className="shrink-0 w-9 h-9 rounded-full bg-muted/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50 cursor-pointer"
            title="Lampirkan file (PDF / Gambar)"
          >
            {isUploading ? (
              <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>

          {/* Text input */}
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={chatId ? "Ask AiDen anything..." : "Tulis pesan pertama untuk memulai..."}
            disabled={isLoading || isUploading}
            className="flex-1 h-10 px-4 rounded-full bg-muted/40 border border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm transition-all"
          />

          {/* Send / Stop */}
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="shrink-0 w-9 h-9 rounded-full bg-destructive flex items-center justify-center text-white hover:brightness-110 transition-all shadow-md cursor-pointer"
              title="Hentikan"
            >
              <Square className="h-3.5 w-3.5 fill-white" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={(!input.trim() && stagingList.length === 0) || isUploading}
              className="shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60 tracking-widest uppercase">
          Aiden Intelligence Engine · v2.1.0
        </p>
      </div>
    </div>
  )
}
