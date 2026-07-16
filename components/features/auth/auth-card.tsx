import { cn } from "@/lib/utils"

interface AuthCardProps {
  title: string
  subtitle: string
  children: React.ReactNode
  className?: string
}

/**
 * Wrapper form reusable untuk semua halaman autentikasi.
 * Disesuaikan untuk split panel layout (tanpa border/shadow berlebih).
 */
export function AuthCard({ title, subtitle, children, className }: AuthCardProps) {
  return (
    <div className={cn("w-full flex flex-col gap-8", className)}>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-6">
        {children}
      </div>
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
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
