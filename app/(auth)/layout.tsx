import Link from "next/link"
import { BookOpen } from "lucide-react"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-muted/20">
      {/* Navbar Full Width */}
      <header className="w-full flex items-center justify-between px-6 sm:px-10 h-16 border-b border-border/40 bg-background shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">Aiden</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Content - Centered Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <div className="w-full max-w-5xl h-full max-h-[700px] flex rounded-3xl border border-border/60 bg-card shadow-2xl overflow-hidden">
          
          {/* Left Panel - Visuals (Hidden on Mobile) */}
          <div className="hidden lg:flex w-1/2 relative bg-muted/30 border-r border-border/40 flex-col items-center justify-center p-12 overflow-hidden">
            {/* Background elements scoped to left panel */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
            <div className="absolute w-[400px] h-[400px] rounded-full border border-primary/20 bg-primary/5 animate-[spin_60s_linear_infinite]" />
            <div className="absolute w-[250px] h-[250px] rounded-full border border-primary/30 bg-primary/10 animate-[spin_40s_linear_infinite_reverse]" />
            
            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="inline-flex items-center rounded-full border border-border/50 bg-background/50 backdrop-blur-md px-3 py-1 mb-5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Belajar Lebih Cerdas</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3 leading-tight">
                Partner AI Terbaik Untuk <br/> <span className="text-primary">Studi Anda</span>
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                Organisasikan materi, buat flashcard otomatis, dan berlatih lebih cerdas dengan AI.
              </p>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 overflow-hidden">
            <div className="w-full max-w-sm">
              {children}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
