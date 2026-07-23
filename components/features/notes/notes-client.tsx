"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  NotebookPen, Plus, Search, MoreVertical, Trash2, Edit3, Eye,
  Loader2, Calendar, Sparkles, Folder, SlidersHorizontal, ChevronLeft, ChevronRight
} from "lucide-react"
import Swal from "sweetalert2"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button, Input, Textarea } from "@/components/ui"
import { Label } from "@/components/ui/label"

const PAGE_SIZE = 8

interface WorkspaceOption {
  id: string
  title: string
}

interface NoteItem {
  id: string
  workspace_id: string | null
  user_id: string
  title: string
  content: string
  category?: string
  created_at: string
  updated_at: string
  workspaces?: { title: string } | null
}

interface NotesClientProps {
  initialWorkspaces: WorkspaceOption[]
}

export function NotesClient({ initialWorkspaces }: NotesClientProps) {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [currentPage, setCurrentPage] = useState(1)

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null)
  const [formTitle, setFormTitle] = useState("")
  const [formCategory, setFormCategory] = useState("Personal Note")
  const [formContent, setFormContent] = useState("")
  const [saving, setSaving] = useState(false)

  // Helper to detect current theme mode (light vs dark)
  const getSwalThemeOptions = () => {
    const isLight = document.documentElement.classList.contains("light")
    return {
      background: isLight ? "#ffffff" : "#090d16",
      color: isLight ? "#0f172a" : "#f8fafc",
      confirmButtonColor: "#10b981",
    }
  }

  // Fetch Notes
  const fetchNotes = useCallback(async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true)
      else setUpdating(true)

      const res = await fetch("/api/notes")
      if (res.ok) {
        const data = await res.json()
        setNotes(data.notes || [])
      }
    } catch (err) {
      console.error("Fetch notes client error:", err)
    } finally {
      setLoading(false)
      setUpdating(false)
    }
  }, [])

  useEffect(() => {
    fetchNotes(true)
  }, [fetchNotes])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingNote(null)
    setFormTitle("")
    setFormCategory("Personal Note")
    setFormContent("")
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (note: NoteItem) => {
    let localCat: string | null = null
    try {
      const stored = localStorage.getItem("aiden_notes_categories") || "{}"
      const map = JSON.parse(stored)
      localCat = map[note.id] || null
    } catch { /* ignore */ }

    const activeCat = note.category || localCat || (note.title.toLowerCase().includes("summary") || note.title.toLowerCase().includes("ringkasan") ? "Summary" : "Personal Note")

    setEditingNote(note)
    setFormTitle(note.title)
    setFormCategory(activeCat)
    setFormContent(note.content)
    setIsModalOpen(true)
  }

  // Open View Modal via SweetAlert2 (Theme Mode Compatible)
  const handleViewNote = (note: NoteItem) => {
    const formattedDate = format(new Date(note.updated_at || note.created_at), "dd MMMM yyyy HH:mm", { locale: localeId })
    
    let localCat: string | null = null
    try {
      const stored = localStorage.getItem("aiden_notes_categories") || "{}"
      const map = JSON.parse(stored)
      localCat = map[note.id] || null
    } catch { /* ignore */ }

    const badgeCategory = note.category || localCat || (note.title.toLowerCase().includes("summary") || note.title.toLowerCase().includes("ringkasan") ? "Summary" : note.workspaces?.title || "Personal Note")
    const swalTheme = getSwalThemeOptions()
    const isLight = document.documentElement.classList.contains("light")

    const safeContent = note.content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>")

    Swal.fire({
      title: `<div style="text-align: left; font-size: 1.15rem; font-weight: 700; color: ${swalTheme.color}; padding-right: 24px;">${note.title}</div>`,
      html: `
        <div style="text-align: left; font-size: 0.8rem; color: #94a3b8; margin-top: 4px; margin-bottom: 14px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 2px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem; text-transform: uppercase;">
            📌 ${badgeCategory}
          </span>
          <span>•</span>
          <span>📅 ${formattedDate}</span>
        </div>
        <div style="text-align: left; background: ${isLight ? "#f8fafc" : "#0f172a"}; border: 1px solid ${isLight ? "#e2e8f0" : "rgba(51, 65, 85, 0.6)"}; border-radius: 14px; padding: 16px; max-height: 380px; overflow-y: auto; color: ${swalTheme.color}; font-size: 0.875rem; line-height: 1.6; white-space: pre-wrap;">${safeContent}</div>
      `,
      background: swalTheme.background,
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        container: "backdrop-blur-sm bg-black/60",
        popup: "rounded-2xl border border-border shadow-2xl p-6",
        closeButton: "focus:outline-none text-muted-foreground hover:text-foreground",
      },
    })
  }

  // Save Note (Create or Update)
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formContent.trim()) {
      Swal.fire({
        ...getSwalThemeOptions(),
        icon: "warning",
        title: "Perhatian",
        text: "Judul dan isi catatan tidak boleh kosong!",
      })
      return
    }

    try {
      let noteIdSaved: string | null = null
      if (editingNote) {
        // Update
        const res = await fetch(`/api/notes/${editingNote.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            content: formContent,
            category: formCategory,
          }),
        })
        if (!res.ok) {
          const errTxt = await res.text()
          throw new Error(errTxt || "Gagal update catatan")
        }
        noteIdSaved = editingNote.id
      } else {
        // Create
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            content: formContent,
            category: formCategory,
          }),
        })
        if (!res.ok) {
          const errTxt = await res.text()
          throw new Error(errTxt || "Gagal membuat catatan")
        }
        const data = await res.json()
        noteIdSaved = data.note?.id
      }

      // Persist local category choice in localStorage if category column doesn't exist in Supabase DB
      if (noteIdSaved && formCategory) {
        try {
          const stored = localStorage.getItem("aiden_notes_categories") || "{}"
          const map = JSON.parse(stored)
          map[noteIdSaved] = formCategory
          localStorage.setItem("aiden_notes_categories", JSON.stringify(map))
        } catch { /* ignore */ }
      }

      setIsModalOpen(false)
      fetchNotes(false)

      Swal.fire({
        ...getSwalThemeOptions(),
        icon: "success",
        title: editingNote ? "Catatan Diperbarui!" : "Catatan Dibuat!",
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (err: any) {
      Swal.fire({
        ...getSwalThemeOptions(),
        icon: "error",
        title: "Gagal Menyimpan",
        text: err.message || "Terjadi kesalahan pada server",
      })
    } finally {
      setSaving(false)
    }
  }

  // Delete Note with SweetAlert Confirmation (Theme Mode Compatible)
  const handleDeleteNote = async (note: NoteItem) => {
    const swalTheme = getSwalThemeOptions()
    const result = await Swal.fire({
      ...swalTheme,
      title: "Hapus Catatan?",
      text: `Catatan "${note.title}" akan dihapus secara permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#334155",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      customClass: {
        container: "backdrop-blur-sm bg-black/60",
        popup: "rounded-2xl border border-border shadow-2xl",
      },
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Gagal menghapus catatan")

        setNotes((prev) => prev.filter((n) => n.id !== note.id))
        Swal.fire({
          ...swalTheme,
          icon: "success",
          title: "Terhapus!",
          text: "Catatan berhasil dihapus.",
          timer: 1500,
          showConfirmButton: false,
        })
      } catch (err: any) {
        Swal.fire({
          ...swalTheme,
          icon: "error",
          title: "Gagal",
          text: err.message || "Gagal menghapus catatan",
        })
      }
    }
  }

  // Reset page on search change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setCurrentPage(1)
  }

  // Filter & Sort Notes
  const filteredNotes = notes
    .filter((n) => {
      const q = searchQuery.toLowerCase()
      const titleMatch = n.title.toLowerCase().includes(q)
      const contentMatch = n.content.toLowerCase().includes(q)
      const catMatch = n.category?.toLowerCase().includes(q)
      const wsMatch = n.workspaces?.title?.toLowerCase().includes(q)
      return titleMatch || contentMatch || catMatch || wsMatch
    })
    .sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      if (sortBy === "az") return a.title.localeCompare(b.title)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

  // Pagination calculation (8 items per page)
  const totalCount = filteredNotes.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const paginatedNotes = filteredNotes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Dynamic Skeleton count: match current notes count on current page or default 4
  const skeletonCount = paginatedNotes.length > 0 ? paginatedNotes.length : Math.min(notes.length || 4, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6">

      {/* ── 1. Hero Header ───────────────── */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
            <NotebookPen className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Personal Library</div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Smart Learning Notes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Simpan rangkuman AI, catatan pribadi, dan poin materi belajar Anda di satu tempat.
            </p>
          </div>
        </div>
        
        <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Note Baru
        </Button>
      </div>

      {/* ── 2. Controls Bar ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-none sm:w-[320px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Cari catatan..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 h-10 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex-shrink-0">
            <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 pl-8 pr-7 text-sm rounded-lg border border-border bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="az">A → Z</option>
            </select>
          </div>
        </div>

        {totalCount > 0 && (
          <p className="text-sm text-muted-foreground flex-shrink-0">
            {totalCount} catatan
          </p>
        )}
      </div>

      {/* ── 3. Notes Grid Layout & Dynamic Skeleton ───────────────────────── */}
      {loading || updating ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-card border border-border animate-pulse p-5 space-y-3">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : paginatedNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border border-dashed bg-card/50 min-h-[320px]">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchQuery ? "Catatan Tidak Ditemukan" : "Belum Ada Catatan"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {searchQuery
              ? `Tidak ada catatan yang cocok dengan kata kunci "${searchQuery}".`
              : "Buat catatan baru atau simpan ringkasan AI langsung dari Workspace Anda."
            }
          </p>
          {!searchQuery && (
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Note Baru
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedNotes.map((note) => {
              const formattedDate = format(new Date(note.updated_at || note.created_at), "dd MMM yyyy", { locale: localeId })
              
              // Get local category fallback if present in localStorage
              let localCat: string | null = null
              try {
                const stored = localStorage.getItem("aiden_notes_categories") || "{}"
                const map = JSON.parse(stored)
                localCat = map[note.id] || null
              } catch { /* ignore */ }

              const categoryBadge = note.category || localCat || (note.title.toLowerCase().includes("summary") || note.title.toLowerCase().includes("ringkasan") ? "Summary" : "Personal Note")
              const isSummaryNote = categoryBadge.toLowerCase().includes("summary")

              return (
                <div
                  key={note.id}
                  onClick={() => handleViewNote(note)}
                  className="group relative bg-card border border-border hover:border-primary/50 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between space-y-4"
                >
                  {/* Header Card */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isSummaryNote
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          : "bg-primary/10 text-primary border border-primary/20"
                      }`}>
                        {categoryBadge}
                      </span>

                      {/* Kebab Dropdown Menu */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 bg-card border-border">
                            <DropdownMenuItem onClick={() => handleViewNote(note)} className="cursor-pointer text-xs flex items-center gap-2">
                              <Eye className="h-3.5 w-3.5 text-primary" />
                              <span>Lihat Detail</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(note)} className="cursor-pointer text-xs flex items-center gap-2">
                              <Edit3 className="h-3.5 w-3.5 text-amber-400" />
                              <span>Edit Note</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteNote(note)} className="cursor-pointer text-xs flex items-center gap-2 text-rose-500 focus:text-rose-500">
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Hapus</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {note.title}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {note.content.replace(/[#*`-]/g, "")}
                    </p>
                  </div>

                  {/* Footer Metadata */}
                  <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formattedDate}
                    </span>
                    {note.workspaces?.title && (
                      <span className="flex items-center gap-1 truncate max-w-[120px]">
                        <Folder className="h-3 w-3 text-primary" />
                        {note.workspaces.title}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Pagination ───────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === currentPage ? "default" : "outline"}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </Button>
              ))}

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── 4. Create / Edit Note Dialog ───────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="flex items-center gap-2">
              <NotebookPen className="h-5 w-5 text-primary" />
              {editingNote ? "Edit Catatan" : "Buat Catatan Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveNote} className="flex flex-col gap-4 w-full min-w-0">
            {/* Title Input */}
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="note-title">Judul Catatan <span className="text-destructive">*</span></Label>
              <Input
                id="note-title"
                placeholder="Masukkan judul catatan..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
                className="w-full"
              />
            </div>

            {/* Category Input */}
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="note-category">Kategori Catatan</Label>
              <select
                id="note-category"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="Personal Note">Personal Note</option>
                <option value="Summary">Summary</option>
                <option value="Materi Belajar">Materi Belajar</option>
                <option value="Tugas">Tugas</option>
              </select>
            </div>

            {/* Content Textarea */}
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="note-content">Isi Catatan <span className="text-destructive">*</span></Label>
              <Textarea
                id="note-content"
                rows={6}
                placeholder="Tulis catatan atau rangkuman di sini..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                required
                className="resize-none h-36 w-full"
              />
            </div>

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  editingNote ? "Simpan Perubahan" : "Buat Note"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
