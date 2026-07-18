"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { MessageSquare, Bot, Send, Sparkles, Square, ChevronDown } from "lucide-react"
import { useChat } from "ai/react"
import type { Message } from "ai/react"

interface AIChatPanelProps {
  workspaceId: string
  fileUrl?: string
}

const PROMPT_SUGGESTIONS = [
  "Jelaskan konsep utama dalam dokumen ini",
  "Buat 3 poin ringkasan dari materi ini",
  "Apa istilah penting yang harus saya pahami?",
] as const

const STORAGE_KEY = (id: string) => `aiden_chat_${id}`

/**
 * Strip all common markdown symbols so AI responses render as plain WhatsApp-style text.
 * The system prompt forbids markdown but the model sometimes still emits it.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1")  // bold + italic
    .replace(/\*\*(.*?)\*\*/g, "$1")       // bold
    .replace(/\*(.*?)\*/g, "$1")           // italic
    .replace(/`{3}[\s\S]*?`{3}/g, "")     // fenced code blocks
    .replace(/`([^`]+)`/g, "$1")           // inline code
    .replace(/^#{1,6}\s+/gm, "")          // headings
    .replace(/^\s*[-*+]\s+/gm, "")        // unordered list markers
    .replace(/^\s*\d+\.\s+/gm, "")        // ordered list markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .trim()
}

/** Load persisted messages from localStorage safely */
function loadMessages(workspaceId: string): Message[] {
  try {
    if (typeof window === "undefined") return []
    const raw = localStorage.getItem(STORAGE_KEY(workspaceId))
    if (!raw) return []
    return JSON.parse(raw) as Message[]
  } catch {
    return []
  }
}

/** Persist messages to localStorage */
function saveMessages(workspaceId: string, messages: Message[]) {
  try {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY(workspaceId), JSON.stringify(messages))
  } catch {
    // Fail silently (e.g. private mode quota)
  }
}

export function AIChatPanel({ workspaceId, fileUrl }: AIChatPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  // Load persisted history on first mount
  const initialMessages = useRef<Message[]>(loadMessages(workspaceId))

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    stop,
  } = useChat({
    api: "/api/chat",
    initialMessages: initialMessages.current,
    body: { workspaceId, fileUrl },
    onFinish: () => {
      // Persist after each completed AI response
      saveMessages(workspaceId, messages)
    },
  })

  // Persist whenever messages change (covers user messages too)
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(workspaceId, messages)
    }
  }, [messages, workspaceId])

  // ─── Smart scroll: only follow if already at bottom ──────────────────────
  const scrollToBottom = useCallback(() => {
    const el = scrollAreaRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const atBottom = distanceFromBottom < 80
    setIsAtBottom(atBottom)
    setShowScrollBtn(!atBottom)
  }, [])

  // Auto-scroll only when user is near the bottom
  useEffect(() => {
    if (isAtBottom) scrollToBottom()
  }, [messages, isLoading, isAtBottom, scrollToBottom])

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Chat Header ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 h-14 border-b border-border bg-card/50 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground leading-tight">Aiden Assistant</p>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-muted-foreground uppercase tracking-wider font-semibold">
                {isLoading ? "Sedang mengetik..." : "Document Context Active"}
              </span>
            </div>
          </div>
        </div>

        {/* Stop generation button */}
        {isLoading && (
          <button
            onClick={() => stop()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-destructive border border-destructive/30 hover:bg-destructive/10 transition-all"
          >
            <Square className="h-3 w-3 fill-destructive" />
            Stop
          </button>
        )}
      </div>

      {/* ── Messages Area ─────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto p-5 flex flex-col gap-5"
        >
          {messages.length === 0 ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto w-full h-full py-10">
              <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mb-5 border border-primary/10">
                <MessageSquare className="h-7 w-7 text-primary/50" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Belum ada percakapan</h3>
              <p className="text-muted-foreground text-sm mb-7">
                Mulai tanya jawab dengan Aiden tentang isi dokumen ini untuk belajar lebih cepat.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                {PROMPT_SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => append({ role: "user", content: suggestion })}
                    disabled={isLoading}
                    className="text-left p-3.5 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
                  >
                    &ldquo;{suggestion}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m: Message, index: number) => {
                const isUser = m.role === "user"
                const displayContent = isUser ? m.content : stripMarkdown(m.content)

                return (
                  <div
                    key={m.id ?? index}
                    className={`flex gap-3 w-fit max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : ""}`}
                  >
                    {/* Aiden avatar */}
                    {!isUser && (
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`
                        px-4 py-3 rounded-2xl text-sm leading-relaxed
                        ${isUser
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted/60 text-foreground rounded-tl-sm border border-border/40"
                        }
                      `}
                    >
                      <div className="whitespace-pre-wrap">{displayContent}</div>
                    </div>
                  </div>
                )
              })}

              {/* Typing indicator — only show before first token arrives */}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 w-fit">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/60 border border-border/40 flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground italic">Aiden sedang memahami dokumen</span>
                    <div className="flex gap-1 ml-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div className="h-2" />
            </>
          )}
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={() => { scrollToBottom(); setShowScrollBtn(false); setIsAtBottom(true) }}
            className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-all"
            title="Scroll ke bawah"
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ── Input Area ────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-3 bg-background/90 border-t border-border backdrop-blur-sm">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center gap-2 max-w-4xl mx-auto w-full"
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Tanya sesuatu tentang dokumen ini..."
            className="flex-1 h-11 pl-5 pr-14 rounded-full bg-muted/40 border border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          Aiden menjawab berdasarkan isi dokumen PDF yang Anda upload
        </p>
      </div>
    </div>
  )
}
