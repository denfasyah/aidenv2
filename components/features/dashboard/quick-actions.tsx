import Link from "next/link"
import { BrainCircuit } from "lucide-react"
import { Card } from "@/components/ui"

/**
 * Card rekomendasi cepat di sidebar dashboard.
 * Mendorong user untuk mulai menggunakan fitur AI Assistant.
 */
export function QuickActions() {
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
      <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
        <BrainCircuit className="h-4 w-4" />
        Mulai Cepat
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Biarkan Asisten AI membantu Anda membuat ringkasan dan kartu flash otomatis.
      </p>
      <Link
        href="/assistant"
        className="block w-full text-center text-sm font-medium bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors"
      >
        Buka Assistant
      </Link>
    </Card>
  )
}
