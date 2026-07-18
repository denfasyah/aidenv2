"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileText, MessageSquare, BookOpen, BrainCircuit, CheckSquare, Download } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

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

export function WorkspaceDetailClient({ workspace, fileInfo }: WorkspaceDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("content")

  const tabs = [
    { id: "content", label: "CONTENT", icon: FileText },
    { id: "chat", label: "CHAT AI", icon: MessageSquare },
    { id: "summary", label: "SUMMARY", icon: BookOpen },
    { id: "flashcard", label: "FLASHCARD", icon: BrainCircuit },
    { id: "quiz", label: "QUIZ", icon: CheckSquare },
  ] as const

  const formattedDate = format(new Date(workspace.created_at), "dd MMM yyyy", { locale: localeId })
  const formattedSize = fileInfo ? (fileInfo.size / 1024 / 1024).toFixed(2) : "0"

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] -m-4 sm:-m-8 p-4 sm:p-8 bg-background">
      {/* Header & Metadata */}
      <div className="flex flex-col gap-6 mb-6">
        <Link 
          href="/workspaces" 
          className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground hover:text-foreground uppercase w-fit transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        {/* Workspace Info Card */}
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-sm">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
          
          <div className="relative flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-inner">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground truncate mb-2">
                {workspace.title}
              </h1>
              
              <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  {formattedDate}
                </span>
                <span className="text-border">•</span>
                <span className="uppercase tracking-wider font-bold text-primary">PDF</span>
                {fileInfo && (
                  <>
                    <span className="text-border">•</span>
                    <span className="uppercase tracking-wider">{formattedSize} MB</span>
                    <span className="text-border">•</span>
                    <span className="truncate max-w-[200px] sm:max-w-[300px] opacity-80">
                      {fileInfo.name}
                    </span>
                  </>
                )}
              </div>
            </div>

            {fileInfo && (
              <a 
                href={fileInfo.url} 
                target="_blank" 
                rel="noreferrer"
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                title="Download PDF"
              >
                <Download className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide border-b border-border/50">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest rounded-t-xl transition-all whitespace-nowrap
                  ${isActive 
                    ? 'bg-card border-x border-t border-border/50 text-foreground shadow-[0_4px_0_0_hsl(var(--background))] translate-y-[1px]' 
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}
                `}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-[600px] md:min-h-[80vh] bg-card rounded-2xl border border-border/50 overflow-hidden relative shadow-sm flex flex-col mt-4">
        
        {/* PDF VIEWER TAB */}
        {activeTab === "content" && (
          <div className="flex-1 flex flex-col w-full h-full">
            <div className="h-10 border-b border-border/50 bg-muted/30 flex items-center px-4 flex-shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Interactive View Engine — PDF Mode
              </span>
            </div>
            <div className="flex-1 w-full bg-black/5 relative">
              {fileInfo?.url ? (
                <object 
                  data={fileInfo.url} 
                  type="application/pdf" 
                  className="absolute inset-0 w-full h-full"
                >
                  <iframe 
                    src={fileInfo.url} 
                    className="w-full h-full border-0"
                    title="PDF Viewer"
                  >
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Browser Anda tidak mendukung penampil PDF. Silakan download file untuk membacanya.
                    </div>
                  </iframe>
                </object>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                  <FileText className="h-12 w-12 mb-4 opacity-20 text-destructive" />
                  <p className="text-destructive font-medium">
                    {fileInfo?.name?.startsWith('ERROR:') 
                      ? fileInfo.name 
                      : "File PDF tidak ditemukan atau telah dihapus."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PLACEHOLDERS FOR OTHER TABS */}
        {activeTab !== "content" && (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-8">
            {tabs.find(t => t.id === activeTab)?.icon({ className: "h-16 w-16 mb-4 text-muted-foreground/30" })}
            <h3 className="text-xl font-bold mb-2">
              Modul {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <p className="text-muted-foreground max-w-md">
              Fitur ini akan segera diimplementasikan pada tahap pengembangan selanjutnya.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
