import Link from "next/link"
import { Button } from "@/components/ui"
import { BookOpen, ArrowLeft, SearchX } from "lucide-react"

/**
 * Halaman 404 - Not Found
 * Ditampilkan oleh Next.js App Router ketika rute tidak ditemukan.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">Aiden</span>
      </div>

      {/* Icon Error */}
      <div className="flex items-center justify-center w-24 h-24 rounded-full bg-muted">
        <SearchX className="h-12 w-12 text-muted-foreground" />
      </div>

      {/* Text Content */}
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl font-bold text-foreground">404</h1>
        <h2 className="text-xl font-semibold text-foreground">Halaman Tidak Ditemukan</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          Oops! Halaman yang Anda cari tidak ada atau telah dipindahkan.
          Pastikan URL yang Anda masukkan sudah benar.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button className="gap-2">
            Ke Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
