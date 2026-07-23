"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import {
  Brain, Sparkles, Loader2, RefreshCw, RotateCcw,
  CheckCircle2, XCircle, FileText, AlertTriangle,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuestionItem {
  id: number
  question: string
  options: string[]
  answerIndex: number
  explanation: string
  pageRef?: string
}

interface AttemptItem {
  attempt_id: string
  created_at: string
  score_percentage: number
  correct_count: number
  total_count: number
  user_answers: Record<number, number>
}

interface QuizData {
  id: string
  title: string
  content: {
    questions?: QuestionItem[]
    questionCount?: number
    attempts?: AttemptItem[]
  }
}

interface QuizPanelProps {
  workspaceId: string
  workspaceTitle: string
  fileUrl?: string
}

type QuizPhase = "loading" | "empty" | "generating" | "playing" | "result"

// localStorage keys per workspace
const SESSION_KEY = (id: string) => `aiden_quiz_session_${id}`
const RESULT_KEY  = (id: string) => `aiden_quiz_result_${id}`

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  icon?: React.ReactNode
}

function ConfirmDialog({
  title, message, confirmLabel, cancelLabel = "Batal",
  onConfirm, onCancel, icon,
}: ConfirmDialogProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4">
        <div className="flex flex-col items-center text-center gap-3">
          {icon && (
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              {icon}
            </div>
          )}
          <h3 className="font-bold text-base text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QuizPanel({ workspaceId, workspaceTitle, fileUrl }: QuizPanelProps) {
  const searchParams = useSearchParams()
  const attemptIdParam = searchParams.get("attempt_id")

  // Core state
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [phase, setPhase] = useState<QuizPhase>("loading")
  const [questionCount, setQuestionCount] = useState<5 | 10>(5)
  const [error, setError] = useState<string | null>(null)

  // Quiz execution
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})
  const [activeAttempt, setActiveAttempt] = useState<AttemptItem | null>(null)

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<null | "partial" | "all">(null)

  // ── Persist session to localStorage ─────────────────────────────────────────
  const saveSession = useCallback((
    answers: Record<number, number>,
    idx: number,
    qList: QuestionItem[],
  ) => {
    try {
      localStorage.setItem(SESSION_KEY(workspaceId), JSON.stringify({
        userAnswers: answers,
        currentQuestionIdx: idx,
        questionCount: qList.length,
        quizId: quiz?.id ?? null,
      }))
    } catch { /* ignore */ }
  }, [workspaceId, quiz?.id])

  // ── 1. Fetch Quiz on Mount ───────────────────────────────────────────────────
  const fetchQuiz = useCallback(async () => {
    try {
      setPhase("loading")
      const res = await fetch("/api/quiz/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.quiz && data.quiz.content?.questions?.length > 0) {
          const qList: QuestionItem[] = data.quiz.content.questions
          setQuiz(data.quiz)
          setQuestions(qList)

          // Priority 1: deep-link to a specific attempt via URL param
          if (attemptIdParam) {
            const attempts: AttemptItem[] = data.quiz.content.attempts || []
            const found = attempts.find((a) => a.attempt_id === attemptIdParam)
            if (found) {
              setActiveAttempt(found)
              setUserAnswers(found.user_answers || {})
              setCurrentQuestionIdx(0)
              setPhase("result")
              return
            }
          }

          // Priority 2: restore completed result from localStorage
          try {
            const rawResult = localStorage.getItem(RESULT_KEY(workspaceId))
            if (rawResult) {
              const savedResult = JSON.parse(rawResult)
              if (
                savedResult.quizId === data.quiz.id &&
                savedResult.attempt &&
                savedResult.userAnswers
              ) {
                setActiveAttempt(savedResult.attempt as AttemptItem)
                setUserAnswers(savedResult.userAnswers as Record<number, number>)
                setCurrentQuestionIdx(0)
                setPhase("result")
                return
              }
            }
          } catch { /* fall through */ }

          // Priority 3: restore in-progress playing session
          try {
            const raw = localStorage.getItem(SESSION_KEY(workspaceId))
            if (raw) {
              const saved = JSON.parse(raw)
              if (
                saved.quizId === data.quiz.id &&
                saved.questionCount === qList.length &&
                saved.userAnswers
              ) {
                const restoredAnswers = saved.userAnswers as Record<number, number>
                const restoredIdx = typeof saved.currentQuestionIdx === "number"
                  ? Math.min(saved.currentQuestionIdx, qList.length - 1)
                  : 0
                setUserAnswers(restoredAnswers)
                setCurrentQuestionIdx(restoredIdx)
                setPhase("playing")
                return
              }
            }
          } catch { /* fallback fresh */ }

          // Priority 4: fresh start
          setUserAnswers({})
          setCurrentQuestionIdx(0)
          setPhase("playing")
        } else {
          setPhase("empty")
        }
      } else {
        setPhase("empty")
      }
    } catch {
      setPhase("empty")
    }
  }, [workspaceId, attemptIdParam])

  useEffect(() => {
    fetchQuiz()
  }, [fetchQuiz])

  // ── 2. Generate Quiz ─────────────────────────────────────────────────────────
  const handleGenerate = async (forceRegenerate = false, overrideCount?: number) => {
    const countToUse = overrideCount ?? questionCount
    try {
      setPhase("generating")
      setError(null)

      const res = await fetch("/api/generate/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, fileUrl, questionCount: countToUse, forceRegenerate }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Gagal membuat quiz")
      }

      const data = await res.json()
      const qList: QuestionItem[] = data.quiz.content.questions
      setQuiz(data.quiz)
      setQuestions(qList)
      setCurrentQuestionIdx(0)
      setUserAnswers({})
      setActiveAttempt(null)
      setPhase("playing")
      // Clear both saved sessions on fresh generate
      try { localStorage.removeItem(SESSION_KEY(workspaceId)) } catch { /* ignore */ }
      try { localStorage.removeItem(RESULT_KEY(workspaceId)) } catch { /* ignore */ }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat membuat quiz"
      setError(msg)
      setPhase("empty")
    }
  }

  // ── 3. Select Option ─────────────────────────────────────────────────────────
  const handleSelectOption = (optionIndex: number) => {
    if (phase === "result") return
    const newAnswers = { ...userAnswers, [currentQuestionIdx]: optionIndex }
    setUserAnswers(newAnswers)
    saveSession(newAnswers, currentQuestionIdx, questions)
  }

  // ── 4. Navigate to question ──────────────────────────────────────────────────
  const goToQuestion = (idx: number) => {
    setCurrentQuestionIdx(idx)
    saveSession(userAnswers, idx, questions)
  }

  // ── 5. Submit trigger (check unanswered) ─────────────────────────────────────
  const handleSubmitTrigger = () => {
    const answered = Object.keys(userAnswers).length
    const total = questions.length
    if (answered === 0) {
      setConfirmDialog("partial")
    } else if (answered < total) {
      setConfirmDialog("partial")
    } else {
      // All answered — still confirm
      setConfirmDialog("all")
    }
  }

  // ── 6. Execute Submit ────────────────────────────────────────────────────────
  const executeSubmit = async () => {
    setConfirmDialog(null)
    if (questions.length === 0) return

    let correct = 0
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.answerIndex) correct++
    })

    const total = questions.length
    const scorePct = Math.round((correct / total) * 100)

    try {
      setSubmitting(true)
      const res = await fetch("/api/quiz/submit-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          userAnswers,
          scorePercentage: scorePct,
          correctCount: correct,
          totalCount: total,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const finalAttempt: AttemptItem = data.attempt
        setActiveAttempt(finalAttempt)
        if (data.quiz) setQuiz(data.quiz)
        // Persist result so refresh stays on result page
        try {
          localStorage.setItem(RESULT_KEY(workspaceId), JSON.stringify({
            quizId: data.quiz?.id ?? quiz?.id ?? null,
            attempt: finalAttempt,
            userAnswers,
          }))
        } catch { /* ignore */ }
      } else {
        const fallbackAttempt: AttemptItem = {
          attempt_id: `local_${Date.now()}`,
          created_at: new Date().toISOString(),
          score_percentage: scorePct,
          correct_count: correct,
          total_count: total,
          user_answers: userAnswers,
        }
        setActiveAttempt(fallbackAttempt)
        // Persist fallback result too
        try {
          localStorage.setItem(RESULT_KEY(workspaceId), JSON.stringify({
            quizId: quiz?.id ?? null,
            attempt: fallbackAttempt,
            userAnswers,
          }))
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.error("Submit Quiz Error:", err)
      const fallbackAttempt: AttemptItem = {
        attempt_id: `local_${Date.now()}`,
        created_at: new Date().toISOString(),
        score_percentage: scorePct,
        correct_count: correct,
        total_count: total,
        user_answers: userAnswers,
      }
      setActiveAttempt(fallbackAttempt)
      try {
        localStorage.setItem(RESULT_KEY(workspaceId), JSON.stringify({
          quizId: quiz?.id ?? null,
          attempt: fallbackAttempt,
          userAnswers,
        }))
      } catch { /* ignore */ }
    } finally {
      setSubmitting(false)
      setPhase("result")
      setCurrentQuestionIdx(0)
      try { localStorage.removeItem(SESSION_KEY(workspaceId)) } catch { /* ignore */ }
    }
  }

  // ── 7. Retake ────────────────────────────────────────────────────────────────
  const handleRestartQuiz = () => {
    setUserAnswers({})
    setActiveAttempt(null)
    setCurrentQuestionIdx(0)
    setPhase("playing")
    try { localStorage.removeItem(SESSION_KEY(workspaceId)) } catch { /* ignore */ }
    try { localStorage.removeItem(RESULT_KEY(workspaceId)) } catch { /* ignore */ }
  }

  // ─── Derived ────────────────────────────────────────────────────────────────
  const currentQ = questions[currentQuestionIdx]
  const isResultMode = phase === "result"
  const currentAnswerSelected = userAnswers[currentQuestionIdx]
  const totalQuestions = questions.length
  const answeredCount = Object.keys(userAnswers).length

  const getFeedbackMessage = (score: number) => {
    if (score === 100) return "Sempurna! Kamu Kuasai Materi Ini! 🎉"
    if (score >= 80) return "Luar Biasa! Pemahaman Sangat Baik! 👍"
    if (score >= 60) return "Bagus! Teruskan Belajar! 💪"
    return "Pelajari Lagi Materinya!"
  }

  const getFeedbackColor = (score: number) => {
    if (score >= 80) return "text-emerald-400"
    if (score >= 60) return "text-amber-400"
    return "text-rose-400"
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER PHASES
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Loading Skeleton ──
  if (phase === "loading") {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 bg-background animate-pulse px-6">
        <div className="h-7 w-44 bg-muted/40 rounded-xl" />
        <div className="h-4 w-32 bg-muted/30 rounded-lg" />
        <div className="h-48 w-full max-w-xl bg-muted/30 rounded-2xl mt-4" />
      </div>
    )
  }

  // ── Generating ──
  if (phase === "generating") {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 h-14 sm:h-16 border-b border-border bg-card/60 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground leading-tight">Intelligence Quiz</h2>
              <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">VALIDASI PENGETAHUAN</p>
            </div>
          </div>
          <button disabled className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/40 text-primary-foreground text-xs font-bold cursor-not-allowed opacity-60">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Mengolah...
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">AI sedang menyusun soal kuis...</h3>
            <p className="text-xs text-muted-foreground">Estimasi: 10–30 detik</p>
          </div>
          <div className="w-40 h-1.5 rounded-full bg-muted/30 overflow-hidden relative">
            <div className="absolute inset-y-0 w-1/3 bg-primary rounded-full" style={{ animation: "progress-sweep 1.2s ease-in-out infinite" }} />
          </div>
        </div>
      </div>
    )
  }

  // ── Empty State ──
  if (phase === "empty") {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 h-14 sm:h-16 border-b border-border bg-card/60 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground leading-tight">Intelligence Quiz</h2>
              <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">VALIDASI PENGETAHUAN</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value) as 5 | 10)}
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:border-primary/60 cursor-pointer"
            >
              <option value={5}>5 Soal</option>
              <option value={10}>10 Soal</option>
            </select>
            <button
              onClick={() => handleGenerate(false)}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>GENERATE</span>
            </button>
          </div>
        </div>
        {/* Body */}
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Brain className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">Belum ada quiz</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Klik <span className="font-semibold text-primary">GENERATE</span> di atas untuk membuat kuis evaluasi berbasis materi PDF ini.
          </p>
          {error && (
            <div className="mt-2 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-2.5 max-w-sm">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PLAYING & RESULT MODE
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">

      {/* ── Confirm Dialog Overlay ──────────────────────────────────────────── */}
      {confirmDialog === "partial" && (
        <ConfirmDialog
          title="Ada soal yang belum dijawab"
          message={`${totalQuestions - answeredCount} dari ${totalQuestions} soal masih kosong. Yakin ingin submit sekarang? Soal yang tidak dijawab akan dianggap salah.`}
          confirmLabel="Ya, Submit Sekarang"
          cancelLabel="Kembali Isi"
          icon={<AlertTriangle className="h-6 w-6" />}
          onConfirm={executeSubmit}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      {confirmDialog === "all" && (
        <ConfirmDialog
          title="Yakin mau submit quiz?"
          message="Semua soal sudah dijawab. Jawaban tidak bisa diubah setelah di-submit."
          confirmLabel="Ya, Submit!"
          cancelLabel="Cek Dulu"
          icon={<CheckCircle2 className="h-6 w-6" />}
          onConfirm={executeSubmit}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* ── Top Header ───────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-border bg-card/60 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Branding */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-xs sm:text-sm text-foreground leading-tight truncate">Intelligence Quiz</h2>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground tracking-widest uppercase">VALIDASI PENGETAHUAN</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {isResultMode ? (
            <>
              <button
                onClick={handleRestartQuiz}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-border bg-card hover:bg-muted text-[11px] sm:text-xs font-semibold text-foreground transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Ulangi</span>
              </button>
              <button
                onClick={() => handleGenerate(true)}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-primary text-primary-foreground text-[11px] sm:text-xs font-bold hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Quiz Baru</span>
              </button>
            </>
          ) : (
            <>
              <select
                value={questionCount}
                onChange={(e) => {
                  const newCount = Number(e.target.value) as 5 | 10
                  setQuestionCount(newCount)
                  handleGenerate(true, newCount)
                }}
                className="h-8 sm:h-9 px-1.5 sm:px-3 rounded-xl border border-border bg-card text-[11px] sm:text-xs font-semibold text-foreground focus:outline-none focus:border-primary/60 cursor-pointer"
              >
                <option value={5}>5 Soal</option>
                <option value={10}>10 Soal</option>
              </select>
              <button
                onClick={() => handleGenerate(true)}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-primary text-primary-foreground text-[11px] sm:text-xs font-bold hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Regenerate</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Main Scrollable Content ───────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ── Score Banner (Result Mode) ────────────────────────────────────── */}
        {isResultMode && activeAttempt && (
          <div className="flex flex-col items-center text-center pt-5 pb-4 px-4 border-b border-border/30">
            <span className={`text-5xl sm:text-6xl font-black tracking-tight ${getFeedbackColor(activeAttempt.score_percentage)}`}>
              {activeAttempt.score_percentage}%
            </span>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {activeAttempt.correct_count} dari {activeAttempt.total_count} jawaban benar
            </p>
            <h2 className="text-sm sm:text-base font-bold text-foreground mt-1.5">
              {getFeedbackMessage(activeAttempt.score_percentage)}
            </h2>
          </div>
        )}

        {/* ── Progress counter (Playing Mode) ──────────────────────────────── */}
        {!isResultMode && (
          <div className="flex items-center justify-between px-4 sm:px-6 pt-3 pb-0">
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">
              {answeredCount}/{totalQuestions} dijawab
            </span>
            {/* Linear progress bar */}
            <div className="flex-1 mx-3 h-1 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">
              Soal {currentQuestionIdx + 1}/{totalQuestions}
            </span>
          </div>
        )}

        {/* ── Question Card ─────────────────────────────────────────────────── */}
        {currentQ && (
          <div className="px-3 sm:px-6 py-3 sm:py-4 max-w-3xl mx-auto space-y-4">

            {/* ── Dot Indicators ───────────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-1">
              {questions.map((q, idx) => {
                const isAnswered = userAnswers[idx] !== undefined
                const isCurrent = idx === currentQuestionIdx
                const isCorrect = isResultMode && userAnswers[idx] === q.answerIndex
                const isWrong = isResultMode && userAnswers[idx] !== undefined && userAnswers[idx] !== q.answerIndex

                let dotClass: string

                if (isResultMode) {
                  if (isCorrect) dotClass = "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500"
                  else if (isWrong) dotClass = "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-rose-500"
                  else dotClass = "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-muted/50"

                  if (isCurrent) dotClass += " ring-2 ring-offset-1 ring-offset-background ring-foreground/50"
                } else {
                  if (isCurrent && isAnswered) {
                    dotClass = "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 ring-2 ring-offset-1 ring-offset-background ring-emerald-400"
                  } else if (isCurrent && !isAnswered) {
                    dotClass = "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-foreground bg-transparent"
                  } else if (isAnswered) {
                    dotClass = "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500"
                  } else {
                    dotClass = "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-border/60 bg-muted/20"
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => goToQuestion(idx)}
                    className={`transition-all hover:scale-110 ${dotClass}`}
                    title={`Soal ${idx + 1}`}
                  />
                )
              })}
            </div>

            {/* ── Question Card Body ───────────────────────────────────────── */}
            <div className="bg-card/60 border border-border/70 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">

              {/* Question status (result) */}
              {isResultMode && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Soal {currentQuestionIdx + 1} / {totalQuestions}
                  </span>
                  {currentAnswerSelected === currentQ.answerIndex ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Benar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      <XCircle className="h-3.5 w-3.5" /> Salah
                    </span>
                  )}
                </div>
              )}

              {/* Question Text */}
              <h3 className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
                {currentQ.question}
              </h3>

              {/* ── Options Grid (2x2) ───────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentQ.options.map((option, optIdx) => {
                  const isUserSelected = currentAnswerSelected === optIdx
                  const isCorrectOption = optIdx === currentQ.answerIndex

                  let cardClass: string

                  if (isResultMode) {
                    if (isCorrectOption) {
                      cardClass = "border-emerald-500/70 bg-emerald-950/40 text-emerald-300"
                    } else if (isUserSelected && !isCorrectOption) {
                      cardClass = "border-rose-500/70 bg-rose-950/40 text-rose-300"
                    } else {
                      cardClass = "border-border/30 bg-muted/10 text-muted-foreground opacity-60"
                    }
                  } else {
                    if (isUserSelected) {
                      cardClass = "border-primary bg-primary/10 text-foreground font-semibold shadow-sm"
                    } else {
                      cardClass = "border-border/60 bg-muted/10 hover:bg-muted/30 text-foreground/80 hover:border-border"
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      disabled={isResultMode}
                      className={`
                        w-full text-left p-3 sm:p-4 rounded-xl border text-xs sm:text-sm
                        transition-all duration-150 flex items-center justify-between gap-2
                        active:scale-[0.98] disabled:cursor-default
                        ${cardClass}
                      `}
                    >
                      <span className="leading-relaxed flex-1">{option}</span>
                      {isResultMode && isCorrectOption && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      )}
                      {isResultMode && isUserSelected && !isCorrectOption && (
                        <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* ── AI Explanation (Result Mode) ─────────────────────────── */}
              {isResultMode && (
                <div className="pt-3 border-t border-border/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-primary font-bold text-[11px] sm:text-xs uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>AI EXPLANATION</span>
                    </div>
                    {currentQ.pageRef && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-bold text-[10px] sm:text-[11px]">
                        <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {currentQ.pageRef}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-foreground/85 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                  <div className="text-[10px] sm:text-xs pt-1.5 border-t border-border/20 space-y-1 font-medium">
                    <p>
                      <span className="text-muted-foreground">Jawaban kamu: </span>
                      <span className="text-rose-400">
                        {currentAnswerSelected !== undefined ? currentQ.options[currentAnswerSelected] : "Tidak dijawab"}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Jawaban benar: </span>
                      <span className="text-emerald-400">{currentQ.options[currentQ.answerIndex]}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Navigation Controls ─────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-2 pt-1 pb-4">
              <button
                onClick={() => goToQuestion(Math.max(0, currentQuestionIdx - 1))}
                disabled={currentQuestionIdx === 0}
                className="px-3 sm:px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← Sebelumnya
              </button>

              {currentQuestionIdx < totalQuestions - 1 ? (
                <button
                  onClick={() => goToQuestion(Math.min(totalQuestions - 1, currentQuestionIdx + 1))}
                  className="px-3 sm:px-4 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-bold transition-all"
                >
                  Selanjutnya →
                </button>
              ) : !isResultMode ? (
                <button
                  onClick={handleSubmitTrigger}
                  disabled={submitting}
                  className="px-4 sm:px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...</>
                    : "✓ Submit Quiz"
                  }
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
