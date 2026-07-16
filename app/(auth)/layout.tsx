import Link from "next/link"
import { BookOpen } from "lucide-react"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Auth Navbar */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-border/40">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">Aiden</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Page Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  )
}
