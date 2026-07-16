import { cn } from "@/lib/utils"

interface AuthCardProps {
  title: string
  subtitle: string
  children: React.ReactNode
  className?: string
}

/**
 * Wrapper card reusable untuk semua halaman autentikasi.
 * Server Component — tidak ada interaksi.
 */
export function AuthCard({ title, subtitle, children, className }: AuthCardProps) {
  return (
    <div className={cn(
      "w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-xl p-8 flex flex-col gap-7",
      className
    )}>
      <div className="text-center flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

interface AuthDividerProps {
  label?: string
}

export function AuthDivider({ label = "atau" }: AuthDividerProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
