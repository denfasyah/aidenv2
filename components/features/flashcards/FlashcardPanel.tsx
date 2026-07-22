"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Layers, Shuffle, RefreshCw, ChevronLeft, ChevronRight,
  Loader2, RotateCcw, CheckCircle2
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type FlashcardItem = { front: string; back: string }
type Reaction = "easy" | "medium" | "hard"
type Phase = "loading" | "empty" | "generating" | "playing" | "complete"

interface FlashcardPanelProps {
  workspaceId: string
  workspaceTitle: string
  fileUrl?: string
}

// ─── Reaction Button Config ───────────────────────────────────────────────────

const REACTIONS: {
  key: Reaction
  label: string
  emoji: string
  activeClass: string
  hoverClass: string
}[] = [
  {
    key: "easy",
    label: "GAMPANG",
    emoji: "⚡",
    activeClass: "bg-teal-900/80 border-teal-500 text-teal-300",
    hoverClass: "hover:bg-emerald-900/60 hover:border-emerald-500",
  },
  {
    key: "medium",
    label: "LUMAYA",
    emoji: "😊",
    activeClass: "bg-amber-900/80 border-amber-500 text-amber-300",
    hoverClass: "hover:bg-amber-900/60 hover:border-amber-500",
  },
  {
    key: "hard",
    label: "SUSAH",
    emoji: "😢",
    activeClass: "bg-rose-900/80 border-rose-500 text-rose-300",
    hoverClass: "hover:bg-rose-900/60 hover:border-rose-500",
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export function FlashcardPanel({ workspaceId, workspaceTitle, fileUrl }: FlashcardPanelProps) {
  // ── State ──
  const [cards, setCards] = useState<FlashcardItem[]>([])
  const [phase, setPhase] = useState<Phase>("loading")
  const [cardCount, setCardCount] = useState<5 | 10>(5)
  const [error, setError] = useState<string | null>(null)

  // Session state
  const [displayOrder, setDisplayOrder] = useState<number[]>([])
  const [currentPos, setCurrentPos] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reactions, setReactions] = useState<Record<number, Reaction>>({})
  const [isShuffled, setIsShuffled] = useState(false)
  const [pendingReaction, setPendingReaction] = useState<Reaction | null>(null)

  // ── Derived values ──
  const totalCards = cards.length
  // currentOriginalIdx: the original index of the card at current display position
  const currentOriginalIdx = displayOrder[currentPos] ?? 0
  const currentCard = cards[currentOriginalIdx] ?? null
  // % done: how many cards have been reviewed (currentPos out of total)
  const percentDone = totalCards > 0 ? Math.round((currentPos / totalCards) * 100) : 0

  // ── Stats (for complete screen) ──
  const easyCount = Object.values(reactions).filter((r) => r === "easy").length
  const mediumCount = Object.values(reactions).filter((r) => r === "medium").length
  const hardCount = Object.values(reactions).filter((r) => r === "hard").length
  const noReactCount = totalCards - easyCount - mediumCount - hardCount

  // ── Session Storage Keys ──
  const SESSION_KEY = `aiden_flashcard_session_${workspaceId}`

  // ── Save state to localStorage ──
  const saveSessionState = useCallback((pos: number, reactMap: Record<number, Reaction>, order: number[], shuffled: boolean) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        currentPos: pos,
        reactions: reactMap,
        displayOrder: order,
        isShuffled: shuffled,
      }))
    } catch { /* ignore */ }
  }, [SESSION_KEY])

  // ── Init session from card array (restores from localStorage if available) ──
  const initSession = useCallback((newCards: FlashcardItem[], forceReset = false) => {
    if (!newCards || newCards.length === 0) {
      setPhase("empty")
      return
    }
    setCards(newCards)

    if (!forceReset) {
      try {
        const saved = localStorage.getItem(SESSION_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (
            typeof parsed.currentPos === "number" &&
            Array.isArray(parsed.displayOrder) &&
            parsed.displayOrder.length === newCards.length
          ) {
            setDisplayOrder(parsed.displayOrder)
            setCurrentPos(parsed.currentPos >= newCards.length ? 0 : parsed.currentPos)
            setReactions(parsed.reactions || {})
            setIsShuffled(!!parsed.isShuffled)
            setIsFlipped(false)
            setPendingReaction(null)
            setPhase(parsed.currentPos >= newCards.length ? "complete" : "playing")
            return
          }
        }
      } catch { /* fallback to clean reset */ }
    }

    // Default clean reset
    const defaultOrder = newCards.map((_, i) => i)
    setCards(newCards)
    setDisplayOrder(defaultOrder)
    setCurrentPos(0)
    setIsFlipped(false)
    setReactions({})
    setIsShuffled(false)
    setPendingReaction(null)
    setPhase("playing")
    try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
  }, [SESSION_KEY])

  // ── Fetch on mount ──
  const fetchFlashcards = useCallback(async () => {
    try {
      setPhase("loading")
      const res = await fetch("/api/flashcards/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.flashcards?.content?.cards?.length > 0) {
          initSession(data.flashcards.content.cards, false)
        } else {
          setPhase("empty")
        }
      } else {
        setPhase("empty")
      }
    } catch {
      setPhase("empty")
    }
  }, [workspaceId, initSession])

  useEffect(() => {
    fetchFlashcards()
  }, [fetchFlashcards])

  // ── Generate ──
  const handleGenerate = useCallback(async (forceRegenerate = false, overrideCount?: number) => {
    try {
      setPhase("generating")
      setError(null)
      const countToUse = overrideCount ?? cardCount
      const res = await fetch("/api/generate/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          fileUrl,
          cardCount: countToUse,
          forceRegenerate,
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Gagal generate flashcard")
      }
      const data = await res.json()
      initSession(data.flashcards.content.cards, true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan"
      setError(msg)
      setPhase("empty")
    }
  }, [workspaceId, fileUrl, cardCount, initSession])

  // ── Shuffle toggle (keeps currentPos intact) ──
  const handleShuffle = useCallback(() => {
    const currentCardIdx = displayOrder[currentPos]
    const remainingIndices = cards.map((_, i) => i).filter((i) => i !== currentCardIdx)

    let newOrder: number[]
    if (isShuffled) {
      // Restore original order, but place current card at currentPos
      newOrder = cards.map((_, i) => i)
    } else {
      // Shuffle remaining, put current card at current position
      const shuffledRemaining = [...remainingIndices].sort(() => Math.random() - 0.5)
      newOrder = [
        ...shuffledRemaining.slice(0, currentPos),
        currentCardIdx,
        ...shuffledRemaining.slice(currentPos),
      ]
    }

    setDisplayOrder(newOrder)
    const newShuffledState = !isShuffled
    setIsShuffled(newShuffledState)
    setIsFlipped(false)
    saveSessionState(currentPos, reactions, newOrder, newShuffledState)
  }, [isShuffled, cards, currentPos, displayOrder, reactions, saveSessionState])

  // ── Navigation ──
  const advanceCard = useCallback(() => {
    if (currentPos < totalCards - 1) {
      const nextPos = currentPos + 1
      setCurrentPos(nextPos)
      setIsFlipped(false)
      setPendingReaction(null)
      saveSessionState(nextPos, reactions, displayOrder, isShuffled)
    } else {
      setPhase("complete")
      saveSessionState(totalCards, reactions, displayOrder, isShuffled)
    }
  }, [currentPos, totalCards, reactions, displayOrder, isShuffled, saveSessionState])

  const handleNext = useCallback(() => {
    advanceCard()
  }, [advanceCard])

  const handlePrev = useCallback(() => {
    if (currentPos > 0) {
      const prevPos = currentPos - 1
      setCurrentPos(prevPos)
      setIsFlipped(false)
      setPendingReaction(null)
      saveSessionState(prevPos, reactions, displayOrder, isShuffled)
    }
  }, [currentPos, reactions, displayOrder, isShuffled, saveSessionState])

  // ── Reaction: set + auto-advance ──
  const handleReaction = useCallback((reaction: Reaction) => {
    setPendingReaction(reaction)
    const updatedReactions = { ...reactions, [currentOriginalIdx]: reaction }
    setReactions(updatedReactions)
    saveSessionState(currentPos, updatedReactions, displayOrder, isShuffled)
    setTimeout(() => {
      setPendingReaction(null)
      advanceCard()
    }, 350)
  }, [currentOriginalIdx, reactions, currentPos, displayOrder, isShuffled, saveSessionState, advanceCard])

  // ── Restart session (same cards, reset state) ──
  const handleRestartSession = useCallback(() => {
    const defaultOrder = cards.map((_, i) => i)
    setDisplayOrder(defaultOrder)
    setCurrentPos(0)
    setIsFlipped(false)
    setReactions({})
    setIsShuffled(false)
    setPendingReaction(null)
    setPhase("playing")
    try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
  }, [cards, SESSION_KEY])

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  // ── Loading mount skeleton ──
  if (phase === "loading") {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 bg-background animate-pulse">
        <div className="h-8 w-48 bg-muted/40 rounded-xl" />
        <div className="h-52 w-full max-w-2xl bg-muted/30 rounded-2xl" />
      </div>
    )
  }

  // ── Generating (AI loading) ──
  if (phase === "generating") {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Header (Tetap Ada Saat Loading) */}
        <div className="flex-shrink-0 h-16 border-b border-border bg-card/60 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground leading-tight">Flashcard</h2>
              <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                AI lagi ngolah materi...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/50 text-primary-foreground text-xs font-bold tracking-wide cursor-not-allowed opacity-75"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Mengolah...
            </button>
          </div>
        </div>

        {/* Loading Content Center */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 px-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">AI lagi bikin flashcard...</h3>
            <p className="text-xs text-muted-foreground">Estimasi: 10–30 detik</p>
          </div>
          <div className="w-48 h-1.5 rounded-full bg-muted/30 overflow-hidden relative">
            <div
              className="absolute inset-y-0 w-1/3 bg-primary rounded-full"
              style={{ animation: "progress-sweep 1.2s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Complete Screen ──
  if (phase === "complete") {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center gap-6 bg-background px-6">
        {/* Check icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1.5">Sesi Selesai! 🎉</h2>
          <p className="text-sm text-muted-foreground">
            GG lu udah review semua kartu materi ini.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
          {[
            { label: "TOTAL", value: totalCards, color: "text-foreground" },
            { label: "EASY", value: easyCount, color: "text-emerald-400" },
            { label: "MEDIUM", value: mediumCount, color: "text-amber-400" },
            { label: "HARD", value: hardCount, color: "text-rose-400" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 bg-card border border-border rounded-2xl py-4 px-2"
            >
              <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{label}</span>
              <span className={`text-2xl font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* No-react note */}
        {noReactCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {noReactCount} kartu dilewati tanpa reaksi
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={handleRestartSession}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-border bg-background hover:bg-muted/50 text-sm font-semibold text-foreground transition-all active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" />
            Ulangi Sesi
          </button>
          <button
            onClick={() => handleGenerate(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 transition-all active:scale-[0.98] shadow-md shadow-primary/20"
          >
            <RefreshCw className="h-4 w-4" />
            Generate Ulang
          </button>
        </div>
      </div>
    )
  }

  // ── Empty State ──
  if (phase === "empty") {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 h-16 border-b border-border bg-card/60 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground leading-tight">Flashcard</h2>
              <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                Asah Ingatan Cepat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Card count selector */}
            <select
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value) as 5 | 10)}
              className="h-9 px-3 rounded-xl border border-border bg-card text-sm font-semibold text-foreground focus:outline-none focus:border-primary/60 cursor-pointer"
            >
              <option value={5}>5 Cards</option>
              <option value={10}>10 Cards (Best)</option>
            </select>
            <button
              onClick={() => handleGenerate(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold tracking-wide hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
            >
              <Layers className="h-3.5 w-3.5" />
              GENERATE
            </button>
          </div>
        </div>

        {/* Empty body */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
            <Layers className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Belum ada flashcard</h3>
          <p className="text-sm text-muted-foreground">
            Klik <span className="font-semibold text-primary">Generate</span> di atas untuk membuat flashcard
          </p>
          {error && (
            <div className="mt-4 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-3">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Playing State ──
  if (phase === "playing" && currentCard) {
    const currentReaction = reactions[currentOriginalIdx] ?? null

    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">

        {/* ── Playing Header ─────────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-b border-border bg-card/60 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-foreground">Flashcard</span>
                <span className="text-xs sm:text-sm font-bold text-primary">{currentPos + 1}</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold">/ {totalCards}</span>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-16 sm:w-24 h-1 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${percentDone}%` }}
                  />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                  {percentDone}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Card count selector during playing */}
            <select
              value={cardCount}
              onChange={(e) => {
                const newCount = Number(e.target.value) as 5 | 10
                setCardCount(newCount)
                handleGenerate(true, newCount)
              }}
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:border-primary/60 cursor-pointer"
            >
              <option value={5}>5 Cards</option>
              <option value={10}>10 Cards (Best)</option>
            </select>
            {/* Shuffle button */}
            <button
              onClick={handleShuffle}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-[11px] sm:text-xs font-bold tracking-wide transition-all active:scale-[0.97] ${
                isShuffled
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isShuffled ? "SHUFFLED" : "SHUFFLE"}</span>
            </button>
            {/* Regenerate button */}
            <button
              onClick={() => handleGenerate(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-primary text-primary-foreground text-[11px] sm:text-xs font-bold tracking-wide hover:brightness-110 active:scale-[0.97] transition-all shadow-sm shadow-primary/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">REGENERATE</span>
            </button>
          </div>
        </div>

        {/* ── Card Area with Side Arrows (Responsive & Scrollable if needed) ── */}
        <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-center justify-center p-3 sm:p-6 gap-3 sm:gap-4 overflow-y-auto">

          {/* Cards Container with Arrows Side by Side on Desktop / Arrows Bottom on Mobile */}
          <div className="flex items-center justify-between w-full max-w-2xl gap-2 sm:gap-4">

            {/* Prev Arrow */}
            <button
              onClick={handlePrev}
              disabled={currentPos === 0}
              className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Flip Card Container */}
            <div
              className="flex-1"
              style={{ perspective: "1200px" }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  minHeight: "320px",
                  transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* ── FRONT (Question) ── */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                  className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col cursor-pointer select-none shadow-lg"
                  onClick={() => setIsFlipped(true)}
                >
                  {/* Badge */}
                  <div className="flex-shrink-0">
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground border border-border rounded-full px-2.5 py-0.5 uppercase">
                      Question
                    </span>
                  </div>

                  {/* Question text */}
                  <div className="flex-1 flex items-center justify-center py-4">
                    <p className="text-base sm:text-xl font-bold text-foreground text-center leading-snug max-w-md">
                      {currentCard.front}
                    </p>
                  </div>

                  {/* Flip hint */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1 text-muted-foreground">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted/40 border border-border flex items-center justify-center">
                      <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">
                      Klik untuk lihat jawaban
                    </span>
                  </div>
                </div>

                {/* ── BACK (Answer + Reactions) ── */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                  className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col select-none shadow-lg"
                >
                  {/* Badge + Click Back Hint */}
                  <div className="flex-shrink-0 flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest text-primary border border-primary/40 rounded-full px-2.5 py-0.5 uppercase bg-primary/5">
                      Answer
                    </span>
                    <button
                      onClick={() => setIsFlipped(false)}
                      className="text-[9px] font-bold text-muted-foreground hover:text-foreground border border-border rounded-full px-2 py-0.5 uppercase transition-colors"
                    >
                      Lihat Soal
                    </button>
                  </div>

                  {/* Answer text — Non-italic, clear, centered, clickable back */}
                  <div
                    className="flex-1 flex items-center justify-center px-2 sm:px-4 py-3 cursor-pointer"
                    onClick={() => setIsFlipped(false)}
                  >
                    <p className="text-xs sm:text-base text-foreground font-medium text-center leading-relaxed">
                      &ldquo;{currentCard.back}&rdquo;
                    </p>
                  </div>

                  {/* Reaction buttons */}
                  <div className="flex-shrink-0 grid grid-cols-3 gap-2">
                    {REACTIONS.map(({ key, label, emoji, activeClass, hoverClass }) => {
                      const isActive = pendingReaction === key || currentReaction === key
                      return (
                        <button
                          key={key}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleReaction(key)
                          }}
                          disabled={pendingReaction !== null}
                          className={`
                            flex flex-col items-center gap-1 py-2 sm:py-2.5 rounded-xl border text-xs font-bold tracking-wider uppercase
                            transition-all active:scale-95 disabled:cursor-not-allowed
                            ${isActive ? activeClass : `border-border bg-muted/20 text-muted-foreground ${hoverClass}`}
                          `}
                        >
                          <span className="text-base sm:text-lg">{emoji}</span>
                          <span className="text-[9px] sm:text-[10px]">{label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Next Arrow */}
            <button
              onClick={handleNext}
              className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all active:scale-95"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Fallback (should never reach here)
  return null
}
