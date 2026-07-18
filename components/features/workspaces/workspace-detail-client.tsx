"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft, FileText, MessageSquare, BookOpen, BrainCircuit, CheckSquare, Sparkles
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import { PDFViewerPanel } from "@/components/features/pdf-viewer/PDFViewerPanel"
import { AIChatPanel } from "@/components/features/ai-chat/AIChatPanel"

// ─────────────────────────── Types ────────────────────────────────────────────

interface WorkspaceDetailClientProps {
  workspace: {
    id: string
    title: string
    created_at: string
  }
  fileInfo: {
    name: string
    size: number
    url: string
  } | null
}

type TabType = "content" | "chat" | "summary" | "flashcard" | "quiz"

const TABS = [
  { id: "content",   label: "CONTENT",   icon: FileText },
  { id: "chat",      label: "CHAT AI",   icon: MessageSquare },
  { id: "summary",   label: "SUMMARY",   icon: BookOpen },
  { id: "flashcard", label: "FLASHCARD", icon: BrainCircuit },
  { id: "quiz",      label: "QUIZ",      icon: CheckSquare },
] as const

const TAB_STORAGE_KEY = (id: string) => `aiden_tab_${id}`

// ─────────────────────────── Main Component ───────────────────────────────────

export function WorkspaceDetailClient({ workspace, fileInfo }: WorkspaceDetailClientProps) {
  // Always start with "content" on server to avoid hydration mismatch.
  // After mount, restore the saved tab from localStorage.
  const [activeTab, setActiveTab] = useState<TabType>("content")
  const [mounted, setMounted] = useState(false)

  const formattedDate = format(new Date(workspace.created_at), "dd MMM yyyy", { locale: localeId })
  const formattedSize = fileInfo ? (fileInfo.size / 1024 / 1024).toFixed(2) : "0"

  // Restore saved tab after hydration completes (client-only)
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY(workspace.id)) as TabType | null
      if (saved && TABS.some(t => t.id === saved)) {
        setActiveTab(saved)
      }
    } catch {
      // ignore - private mode / storage unavailable
    }
  }, [workspace.id])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    try {
      localStorage.setItem(TAB_STORAGE_KEY(workspace.id), tab)
    } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] -m-4 sm:-m-8">

      {/* ── Compact Header ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 sm:px-8 pt-3 pb-2 flex-shrink-0">
        <Link
          href="/workspaces"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-muted-foreground hover:text-foreground uppercase transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <span className="text-border text-xs">|</span>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate">{workspace.title}</h1>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground flex-shrink-0">
              <span suppressHydrationWarning>{formattedDate}</span>
              <span className="text-border">•</span>
              <span className="font-bold text-primary uppercase">PDF</span>
              {fileInfo && (
                <>
                  <span className="text-border">•</span>
                  <span suppressHydrationWarning>{formattedSize} MB</span>
                  <span className="text-border">•</span>
                  <span className="truncate max-w-[180px] opacity-60">{fileInfo.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto flex-shrink-0 px-4 sm:px-8">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = mounted ? activeTab === id : id === "content"
          return (
            <button
              key={id}
              onClick={() => handleTabChange(id as TabType)}
              className={`
                flex items-center gap-2 px-5 py-3 text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap border-b-2
                ${isActive
                  ? "text-primary border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent"
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Tab Panels (all kept alive to preserve state) ─────────────────── */}
      <div className="flex-1 min-h-0 mx-4 sm:mx-8 my-4 bg-card border border-border rounded-2xl overflow-hidden shadow-sm relative">

        {/* Content (PDF Viewer) */}
        <div className={`absolute inset-0 ${activeTab === "content" ? "block" : "hidden"}`}>
          <PDFViewerPanel fileInfo={fileInfo} />
        </div>

        {/* Chat AI */}
        <div className={`absolute inset-0 ${activeTab === "chat" ? "block" : "hidden"}`}>
          <AIChatPanel workspaceId={workspace.id} fileUrl={fileInfo?.url} />
        </div>

        {/* Coming Soon — Summary / Flashcard / Quiz */}
        {(["summary", "flashcard", "quiz"] as const).map((id) => (
          <div
            key={id}
            className={`absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/10 ${activeTab === id ? "block" : "hidden"}`}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Sparkles className="h-8 w-8 text-primary opacity-50" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">Coming Soon</p>
            <p className="max-w-md text-sm">
              Fitur {id.toUpperCase()} sedang dalam tahap pengembangan.
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
