"use client"

import Link from "next/link"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { FolderKanban, MoreVertical, Trash2, Pencil, Star, Play, FileText, Calendar } from "lucide-react"
import { Button } from "@/components/ui"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { deleteWorkspace, toggleFavoriteWorkspace } from "@/app/(main)/workspaces/actions"
import { showAlert } from "@/lib/swal"

interface WorkspaceCardProps {
  id: string
  title: string
  description: string | null
  createdAt: string
  isFavorite: boolean
}

export function WorkspaceCard({ id, title, description, createdAt, isFavorite }: WorkspaceCardProps) {
  const [favorite, setFavorite] = useState(isFavorite)
  const [loadingFav, setLoadingFav] = useState(false)

  const timeAgo = formatDistanceToNow(new Date(createdAt), { 
    addSuffix: true, 
    locale: localeId 
  })

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    const result = await showAlert.confirm(
      "Hapus Workspace?",
      `Workspace "${title}" dan semua data di dalamnya akan terhapus permanen.`,
      "Ya, Hapus!",
      "Batal"
    )
    if (result.isConfirmed) {
      const res = await deleteWorkspace(id)
      if (res?.error) showAlert.error("Gagal", res.error)
      else showAlert.success("Terhapus", "Workspace berhasil dihapus.")
    }
  }

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoadingFav(true)
    const prev = favorite
    setFavorite(!prev) // optimistic update
    const res = await toggleFavoriteWorkspace(id, prev)
    if (res?.error) {
      setFavorite(prev) // rollback
      showAlert.error("Gagal", res.error)
    }
    setLoadingFav(false)
  }

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <FolderKanban className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {/* Favorite Button */}
          <button
            onClick={handleFavorite}
            disabled={loadingFav}
            className={`p-1.5 rounded-lg transition-colors ${
              favorite 
                ? "text-yellow-400 hover:text-yellow-500" 
                : "text-muted-foreground hover:text-yellow-400"
            }`}
            title={favorite ? "Hapus dari favorit" : "Tambah ke favorit"}
          >
            <Star className={`h-4 w-4 ${favorite ? "fill-yellow-400" : ""}`} />
          </button>

          {/* 3-dot Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" sideOffset={8} className="w-40">
              <DropdownMenuItem 
                className="cursor-pointer gap-2"
                onClick={(e) => {
                  e.preventDefault()
                  // TODO: open edit dialog
                  showAlert.error("Segera Hadir", "Fitur edit workspace sedang dalam pengembangan.")
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 flex-1 flex flex-col gap-1">
        <h3 className="font-semibold text-foreground line-clamp-1 text-base">{title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
          {description || "Tidak ada deskripsi."}
        </p>
      </div>

      {/* Badges */}
      <div className="px-4 pt-3 flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wide">
          <FolderKanban className="h-2.5 w-2.5" />
          Workspace
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
          <FileText className="h-2.5 w-2.5" />
          PDF Document
        </span>
      </div>

      {/* Timestamp */}
      <div className="px-4 pt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>{timeAgo}</span>
      </div>

      {/* Footer: Start Learning Button */}
      <div className="p-4 pt-3 mt-auto">
        <Link href={`/workspaces/${id}`}>
          <Button className="w-full gap-2 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm group-hover:shadow transition-all">
            <Play className="h-4 w-4 fill-current" />
            Start Learning
          </Button>
        </Link>
      </div>
    </div>
  )
}
