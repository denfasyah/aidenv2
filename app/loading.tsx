import Link from "next/link"
import { Button } from "@/components/ui"
import { BookOpen, Loader2 } from "lucide-react"

/**
 * Halaman Loading Global
 * Ditampilkan oleh Next.js App Router saat menunggu Server Component selesai.
 * File ini berlaku untuk seluruh aplikasi (root loading.tsx).
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">Aiden</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Memuat halaman...</span>
      </div>
    </div>
  )
}
