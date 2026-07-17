"use client"

import { useState, useRef } from "react"
import { useFormStatus } from "react-dom"
import { Plus, FolderKanban, Loader2, FileText, UploadCloud, X } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button, Input, Textarea } from "@/components/ui"
import { Label } from "@/components/ui/label"
import { createWorkspace } from "@/app/(main)/workspaces/actions"
import { showAlert } from "@/lib/swal"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Membuat...
        </>
      ) : (
        "Buat Workspace"
      )}
    </Button>
  )
}

export function CreateWorkspaceDialog() {
  const [open, setOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setSelectedFile(null)
    setDragActive(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function handleAction(formData: FormData) {
    const result = await createWorkspace(formData)
    if (result?.error) {
      showAlert.error("Gagal", result.error)
    } else {
      showAlert.success("Berhasil", "Workspace baru telah dibuat!")
      setOpen(false)
      resetForm()
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (file.type === "application/pdf") {
        setSelectedFile(file)
        if (inputRef.current) {
          const dt = new DataTransfer()
          dt.items.add(file)
          inputRef.current.files = dt.files
        }
      } else {
        showAlert.error("Format Salah", "Hanya file PDF yang diperbolehkan.")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Workspace Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            Buat Workspace Baru
          </DialogTitle>
          <DialogDescription>
            Upload materi PDF Anda. AI akan menggunakan dokumen ini sebagai konteks untuk menghasilkan flashcard, kuis, dan ringkasan.
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleAction} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Judul Workspace <span className="text-destructive">*</span></Label>
            <Input 
              id="title" 
              name="title" 
              placeholder="Contoh: Matematika Dasar" 
              required 
              maxLength={50}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Deskripsi (Opsional)</Label>
            <Textarea 
              id="description" 
              name="description" 
              placeholder="Topik utama yang akan dipelajari..." 
              className="resize-none h-20"
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="file">
              Upload PDF Materi <span className="text-destructive">*</span>
              <span className="text-muted-foreground font-normal ml-1">(Wajib untuk konteks AI)</span>
            </Label>

            {/* Hidden file input — dijalankan hanya via label atau drag-drop, BUKAN klik div */}
            <input 
              id="file"
              name="file" 
              type="file" 
              accept="application/pdf"
              className="sr-only"
              ref={inputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setSelectedFile(e.target.files[0])
                }
              }}
            />

            {/* Drop Zone — klik via <label htmlFor="file"> agar tidak ada bubble aneh */}
            <div 
              className={`relative border-2 border-dashed rounded-xl transition-all duration-200 
                ${dragActive 
                  ? 'border-primary bg-primary/10 scale-[1.01]' 
                  : selectedFile 
                    ? 'border-primary/70 bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/30'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="flex items-center gap-3 p-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · PDF
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Hapus file"
                    className="flex-shrink-0 p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                    onClick={() => {
                      setSelectedFile(null)
                      if (inputRef.current) inputRef.current.value = ""
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                // Gunakan <label> agar klik hanya trigger input[file], tidak bubble ke komponen lain
                <label htmlFor="file" className="flex flex-col items-center gap-2 py-8 px-4 cursor-pointer">
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Klik atau seret file PDF ke sini</p>
                  <p className="text-xs text-muted-foreground">Maks. 50MB · Hanya format .pdf</p>
                </label>
              )}
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
