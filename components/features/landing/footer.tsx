import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background py-10 px-4 sm:px-6 relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-foreground">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="tracking-tight">Aiden</span>
        </Link>
        
        {/* Nav Links - pushed right */}
        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-medium text-muted-foreground md:ml-auto">
          <Link href="#" className="hover:text-foreground transition-colors">Beranda</Link>
          <Link href="#about" className="hover:text-foreground transition-colors">Tentang</Link>
          <Link href="#features" className="hover:text-foreground transition-colors">Fitur</Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">Cara Kerja</Link>
        </nav>
        
        {/* Copyright */}
        <p suppressHydrationWarning className="text-sm text-muted-foreground md:ml-8">
          © {new Date().getFullYear()} Aiden.
        </p>
      </div>
    </footer>
  )
}
