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

import { useRouter } from "next/navigation"

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
  const [formError, setFormError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const resetForm = () => {
    setSelectedFile(null)
    setDragActive(false)
    setFormError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const openFilePicker = () => {
    inputRef.current?.click()
  }

  async function handleAction(formData: FormData) {
    setFormError(null)
    const result = await createWorkspace(formData)
    
    if (result?.error) {
      setFormError(result.error)
    } else {
      showAlert.success("Berhasil", "Workspace baru telah dibuat!")
      setOpen(false)
      resetForm()
      router.push("/workspaces") // Reset filter
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setFormError(null)
    const files = e.dataTransfer.files
    if (files?.[0]) {
      const file = files[0]
      if (file.type === "application/pdf") {
        setSelectedFile(file)
        if (inputRef.current) {
          const dt = new DataTransfer()
          dt.items.add(file)
          inputRef.current.files = dt.files
        }
      } else {
        setFormError("Format Salah. Hanya file PDF yang diperbolehkan.")
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
      <DialogContent className="sm:max-w-[440px] p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            Buat Workspace Baru
          </DialogTitle>
          <DialogDescription className="text-sm">
            Upload materi PDF Anda. AI akan menggunakan dokumen ini sebagai konteks pembelajaran.
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleAction} className="flex flex-col gap-4 w-full min-w-0">
          {formError && (
            <div className="p-3 rounded-lg bg-destructive/15 text-destructive text-sm font-medium border border-destructive/20 flex items-start gap-2 w-full">
              <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="flex-1 min-w-0 break-words">{formError}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="title">Judul Workspace <span className="text-destructive">*</span></Label>
            <Input 
              id="title" 
              name="title" 
              placeholder="Contoh: Matematika Dasar" 
              required 
              maxLength={50}
              className="w-full"
            />
          </div>
          
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="description">Deskripsi (Opsional)</Label>
            <Textarea 
              id="description" 
              name="description" 
              placeholder="Topik utama yang akan dipelajari..." 
              className="resize-none h-20 w-full"
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Label>
              Upload PDF Materi <span className="text-destructive">*</span>
              <span className="text-muted-foreground font-normal ml-1">(Wajib)</span>
            </Label>

            {/* Hidden native input — TIDAK dihubungkan ke label manapun untuk menghindari bug click-through */}
            <input 
              name="file" 
              type="file" 
              accept="application/pdf"
              className="sr-only"
              ref={inputRef}
              tabIndex={-1}
              onChange={(e) => {
                if (e.target.files?.[0]) setSelectedFile(e.target.files[0])
              }}
            />

            {/* Drop Zone — events drag only, click handled via button di dalam */}
            <div 
              className={`border-2 border-dashed rounded-xl transition-all duration-200 w-full min-w-0
                ${dragActive 
                  ? 'border-primary bg-primary/10' 
                  : selectedFile 
                    ? 'border-primary/60 bg-primary/5'
                    : 'border-border'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 w-full min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
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
                <div className="flex flex-col items-center gap-2 py-4 px-4">
                  <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-[13px] font-medium">Seret file PDF ke sini</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">atau</p>
                  </div>
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="px-3 py-1 text-xs font-medium rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors"
                  >
                    Pilih dari komputer
                  </button>
                  <p className="text-[11px] text-muted-foreground mt-1">Maks. 50MB · Hanya .pdf</p>
                </div>
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
