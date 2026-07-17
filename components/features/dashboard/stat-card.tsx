import { type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description: string
}

/**
 * Kartu statistik ringkas untuk halaman Dashboard.
 * Reusable — bisa digunakan di halaman lain jika diperlukan.
 */
export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <Card className="p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-foreground">{value}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  )
}
