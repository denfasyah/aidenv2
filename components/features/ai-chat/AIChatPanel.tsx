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

// ─── Persistence helpers (client-only) ────────────────────────────────────────

function loadMessages(workspaceId: string): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(workspaceId))
    if (!raw) return []
    return JSON.parse(raw) as Message[]
  } catch {
    return []
  }
}

function saveMessages(workspaceId: string, messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY(workspaceId), JSON.stringify(messages))
  } catch { /* ignore */ }
}

// ─── Message formatter ────────────────────────────────────────────────────────
/**
 * Parse AI text into React elements with proper formatting:
 * - **text** → <strong>
 * - Numbered lists (1. item)
 * - Plain paragraphs
 * - Preserves emoji naturally
 */
function parseInline(text: string): React.ReactNode[] {
  // Split on **...** to handle bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    }
    // Remove stray single * markers
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
      // empty line → spacing
      elements.push(<div key={i} className="h-1.5" />)
      i++
      continue
    }

    // Numbered list item: "1. text" or "1) text"
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/)
    if (numMatch) {
      elements.push(
        <div key={i} className="flex gap-2 leading-relaxed">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
            {numMatch[1]}
          </span>
          <span>{parseInline(numMatch[2])}</span>
        </div>
      )
      i++
      continue
    }

    // Heading-like line (ends with : and short, or all caps word)
    // We detect it as a "section header" if the line has no period and is under 60 chars
    const isHeader = trimmed.endsWith(":") && trimmed.length < 60 && !trimmed.startsWith("-")
    if (isHeader) {
      elements.push(
        <p key={i} className="font-semibold text-foreground/90 mt-2 first:mt-0">
          {parseInline(trimmed)}
        </p>
      )
      i++
      continue
    }

    // Dash bullet: "- item" or "• item"  
    const bulletMatch = trimmed.match(/^[-•]\s+(.+)/)
    if (bulletMatch) {
      elements.push(
        <div key={i} className="flex gap-2 leading-relaxed">
          <span className="flex-shrink-0 text-primary mt-1.5">•</span>
          <span>{parseInline(bulletMatch[1])}</span>
        </div>
      )
      i++
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="leading-relaxed">
        {parseInline(trimmed)}
      </p>
    )
    i++
  }

  return <div className="flex flex-col gap-1 text-sm">{elements}</div>
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AIChatPanel({ workspaceId, fileUrl }: AIChatPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalSubmit,
    isLoading,
    append,
    stop,
    setMessages,
  } = useChat({
    api: "/api/chat",
    // Always start empty to avoid SSR/client hydration mismatch.
    // Messages are loaded from localStorage in useEffect below.
    initialMessages: [],
    body: { workspaceId, fileUrl },
    onError: (err) => {
      const msg = err.message ?? ""
      if (msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota")) {
        setErrorMsg("Aiden lagi kena rate limit nih, coba lagi beberapa detik ya 🙏")
      } else {
        setErrorMsg("Waduh ada error, coba refresh atau tanya lagi ya 😅")
      }
    },
    onFinish: (msg) => {
      setErrorMsg(null)
      // Save after AI responds (we save the full updated list in the next effect)
      void msg
    },
  })

  // Load persisted messages AFTER mount (client-only, avoids hydration error)
  useEffect(() => {
    const saved = loadMessages(workspaceId)
    if (saved.length > 0) {
      setMessages(saved)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]) // run once on mount per workspace

  // Persist messages whenever they update
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(workspaceId, messages)
    }
  }, [messages, workspaceId])

  // ─── Smart scroll ──────────────────────────────────────────────────────────
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

  // Auto-scroll only when at bottom
  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // When user sends, force scroll to bottom so they see their own message
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsAtBottom(true)
    setShowScrollBtn(false)
    setErrorMsg(null)
    originalSubmit(e)
  }

  const handleSuggestion = (suggestion: string) => {
    setIsAtBottom(true)
    setShowScrollBtn(false)
    append({ role: "user", content: suggestion })
  }

  // Determine the last assistant message being streamed
  const lastMsg = messages[messages.length - 1]
  const isWaitingForFirstToken = isLoading && lastMsg?.role === "user"

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Chat Header ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 h-14 border-b border-border bg-card/50 flex items-center px-5">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
            {isLoading && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
            )}
          </div>
          <div>
            <p className="font-bold text-sm text-foreground leading-tight">Aiden Assistant</p>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? "bg-amber-400 animate-pulse" : "bg-green-500 animate-pulse"}`} />
              <span className="text-muted-foreground uppercase tracking-wider font-semibold">
                {isLoading ? "Sedang mengetik..." : "Document Context Active"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Messages Area ─────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto p-5 flex flex-col gap-4"
        >
          {messages.length === 0 ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto w-full h-full py-8">
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
                    onClick={() => handleSuggestion(suggestion)}
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
                return (
                  <div
                    key={m.id ?? index}
                    className={`flex gap-3 w-fit max-w-[88%] ${isUser ? "ml-auto flex-row-reverse" : ""}`}
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
                        px-4 py-3 rounded-2xl
                        ${isUser
                          ? "bg-primary text-primary-foreground rounded-tr-sm text-sm leading-relaxed"
                          : "bg-muted/60 text-foreground rounded-tl-sm border border-border/40"
                        }
                      `}
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

              {/* Typing indicator — waiting for first token */}
              {isWaitingForFirstToken && (
                <div className="flex gap-3 w-fit">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/60 border border-border/40 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground italic">Aiden sedang memahami dokumen</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              )}

              {/* Error banner */}
              {errorMsg && (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-2.5 w-fit">
                  {errorMsg}
                </div>
              )}

              <div className="h-2" />
            </>
          )}
        </div>

        {/* ↓ Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={() => { scrollToBottom(true); setShowScrollBtn(false); setIsAtBottom(true) }}
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
          {/* Send button / Stop button — toggles based on loading state */}
          {isLoading ? (
            <button
              type="button"
              onClick={() => stop()}
              className="absolute right-2 w-8 h-8 rounded-full bg-destructive flex items-center justify-center text-white hover:brightness-110 transition-all shadow-md"
              title="Stop generating"
            >
              <Square className="h-3.5 w-3.5 fill-white" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          Aiden menjawab berdasarkan isi dokumen PDF yang Anda upload
        </p>
      </div>
    </div>
  )
}
