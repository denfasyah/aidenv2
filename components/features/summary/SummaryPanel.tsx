"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Sparkles, FileText, Copy, Check, FileDown, Loader2, BookmarkPlus } from "lucide-react"

interface SummaryPanelProps {
  workspaceId: string
  workspaceTitle: string
  fileUrl?: string
}

interface SummaryData {
  id: string
  title: string
  content: { text?: string } | string
  created_at: string
}

// ─── Markdown / Text Formatter ────────────────────────────────────────────────
function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    }
    return part.replace(/\*/g, "")
  })
}

function FormattedMarkdown({ content }: { content: string }) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === "") {
      elements.push(<div key={i} className="h-3" />)
      i++
      continue
    }

    // Headings: ### Title or ## Title or # Title
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2]
      elements.push(
        <div key={i} className={`font-bold text-foreground tracking-tight ${level <= 2 ? "text-lg mt-5 mb-2 border-b border-border/50 pb-1.5" : "text-base mt-4 mb-1.5 text-primary"}`}>
          {parseInline(text)}
        </div>
      )
      i++
      continue
    }

    // Dash / bullet item: "- item" or "* item"
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/)
    if (bulletMatch) {
      elements.push(
        <div key={i} className="flex gap-2.5 leading-relaxed text-sm text-foreground/90 pl-2 py-0.5">
          <span className="flex-shrink-0 text-primary font-bold">•</span>
          <div>{parseInline(bulletMatch[1])}</div>
        </div>
      )
      i++
      continue
    }

    // Numbered item: "1. item"
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/)
    if (numMatch) {
      elements.push(
        <div key={i} className="flex gap-2.5 leading-relaxed text-sm text-foreground/90 pl-1 py-0.5">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5 border border-primary/20">
            {numMatch[1]}
          </span>
          <div className="pt-0.5">{parseInline(numMatch[2])}</div>
        </div>
      )
      i++
      continue
    }

    // Blockquote: "> quote"
    if (trimmed.startsWith(">")) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-primary/60 bg-primary/5 px-4 py-2 rounded-r-xl my-2 text-sm italic text-foreground/80">
          {parseInline(trimmed.replace(/^>\s*/, ""))}
        </blockquote>
      )
      i++
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="leading-relaxed text-sm text-foreground/90">
        {parseInline(trimmed)}
      </p>
    )
    i++
  }

  return <div className="space-y-1">{elements}</div>
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SummaryPanel({ workspaceId, workspaceTitle, fileUrl }: SummaryPanelProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [savedNoteSuccess, setSavedNoteSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch summary from API on mount
  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/summary/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      })
      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  // Generate / Regenerate Summary
  const handleGenerate = async (isRegenerate = false) => {
    try {
      setGenerating(true)
      setError(null)
      const res = await fetch("/api/generate/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          fileUrl,
          forceRegenerate: isRegenerate || Boolean(summary),
        }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Gagal membuat summary")
      }

      const data = await res.json()
      setSummary(data.summary)
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat membuat summary")
    } finally {
      setGenerating(false)
    }
  }

  // Copy to Clipboard
  const handleCopy = () => {
    const rawText = typeof summary?.content === "object" ? summary.content.text : summary?.content
    if (!rawText) return
    navigator.clipboard.writeText(rawText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Save to Notes
  const handleSaveToNotes = async () => {
    const rawText = typeof summary?.content === "object" ? summary.content.text : summary?.content
    if (!rawText) return

    try {
      setSavingNote(true)
      const res = await fetch("/api/summary/save-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          title: `Ringkasan: ${workspaceTitle}`,
          content: rawText,
        }),
      })

      if (!res.ok) throw new Error("Gagal menyimpan ke Catatan")

      setSavedNoteSuccess(true)
      setTimeout(() => setSavedNoteSuccess(false), 3000)
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan ke Catatan")
    } finally {
      setSavingNote(false)
    }
  }

  const rawSummaryText = summary
    ? typeof summary.content === "object"
      ? summary.content.text ?? ""
      : summary.content
    : ""

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      
      {/* ── Top Header Panel ──────────────────────────────────────────────── */}
      <div className="flex-shrink-0 h-16 border-b border-border bg-card/60 px-6 flex items-center justify-between gap-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-base text-foreground leading-tight">Summary</h2>
            <p className="text-xs text-muted-foreground">
              {generating ? "AI lagi ngolah dokumen lu..." : summary ? "Ringkasan AI siap dipelajari" : "Belum ada ringkasan untuk dokumen ini"}
            </p>
          </div>
        </div>

        {/* Generate / Re-generate Button */}
        <button
          onClick={() => handleGenerate(Boolean(summary))}
          disabled={generating || loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold tracking-wide hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengolah Summary...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 fill-primary-foreground/20" />
              {summary ? "GENERATE ULANG" : "GENERATE SUMMARY"}
            </>
          )}
        </button>
      </div>

      {/* ── Content View Area ─────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative overflow-y-auto p-6 sm:p-8">
        {generating ? (
          /* Loading Overlay State (Matches Screenshot Reference) */
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto h-full py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 relative">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">AI sedang membaca dokumen...</h3>
            <p className="text-xs text-muted-foreground mb-6">Estimasi: 10–30 detik</p>

            {/* Sweeping Progress Bar */}
            <div className="w-48 h-1.5 rounded-full bg-muted/30 overflow-hidden relative">
              <div
                className="absolute inset-y-0 w-1/3 bg-primary rounded-full"
                style={{ animation: 'progress-sweep 1.2s ease-in-out infinite' }}
              />
            </div>
          </div>
        ) : loading ? (
          /* Initial Mount Loading Skeleton */
          <div className="max-w-3xl mx-auto space-y-4 py-4 animate-pulse">
            <div className="h-8 bg-muted/60 rounded-lg w-1/3" />
            <div className="h-4 bg-muted/40 rounded w-full" />
            <div className="h-4 bg-muted/40 rounded w-5/6" />
            <div className="h-4 bg-muted/40 rounded w-4/6" />
            <div className="h-20 bg-muted/30 rounded-xl w-full mt-6" />
          </div>
        ) : summary ? (
          /* Rendered Summary Document */
          <div className="max-w-4xl mx-auto pb-16">
            <div className="bg-card/40 border border-border/60 rounded-2xl p-6 sm:p-8 shadow-sm">
              <FormattedMarkdown content={rawSummaryText} />
            </div>
          </div>
        ) : (
          /* Empty State Design (Matches UI Reference Image) */
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto h-full py-12">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-5 border border-primary/20 shadow-inner">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Belum ada ringkasan</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Klik <span className="font-semibold text-primary">Generate Summary</span> di atas untuk membuat ringkasan otomatis dari dokumen ini menggunakan AI.
            </p>
          </div>
        )}

        {/* Error State Handling Alert */}
        {error && (
          <div className="max-w-md mx-auto my-4 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/30 rounded-2xl p-4 text-center flex items-center justify-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}
      </div>

      {/* ── Bottom Action Controls (Copy & Save to Notes) ─────────────────── */}
      {summary && (
        <div className="flex-shrink-0 p-4 border-t border-border bg-card/80 backdrop-blur-md flex items-center justify-center gap-3 sm:gap-4">
          {/* Copy to Clipboard */}
          <button
            onClick={handleCopy}
            className="flex-1 max-w-xs inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/60 text-xs font-semibold text-foreground transition-all active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-green-500 font-bold">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-muted-foreground" />
                <span>Copy to Clipboard</span>
              </>
            )}
          </button>

          {/* Save to Notes */}
          <button
            onClick={handleSaveToNotes}
            disabled={savingNote}
            className="flex-1 max-w-xs inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {savingNote ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : savedNoteSuccess ? (
              <>
                <Check className="h-4 w-4 text-primary" />
                <span className="font-bold">Tersimpan di Notes!</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="h-4 w-4 text-primary" />
                <span>Save to Notes</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
