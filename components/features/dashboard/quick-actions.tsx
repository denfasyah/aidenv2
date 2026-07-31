import Link from "next/link"
import { BrainCircuit, MessageSquare, FileText, HelpCircle } from "lucide-react"
import { Card } from "@/components/ui"

/**
 * Card rekomendasi AI Assistant di dashboard.
 * Mendorong user untuk membuka workspace untuk berinteraksi dengan AI.
 */
export function QuickActions() {
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 flex flex-col gap-4 shadow-sm">
      <h3 className="font-semibold text-primary flex items-center gap-2">
        <BrainCircuit className="h-5 w-5 animate-pulse" />
        Rekomendasi
      </h3>
      <p className="text-sm text-muted-foreground">
        Masuk ke salah satu <strong>Workspace</strong> Anda untuk mulai belajar dengan AI Assistant:
      </p>

      <ul className="space-y-3.5 text-xs text-muted-foreground">
        <li className="flex items-start gap-2.5">
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-primary mt-0.5 shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-medium text-foreground block">Tanya Jawab Pintar</span>
            Diskusikan materi pelajaran langsung dengan AI di ruang obrolan.
          </div>
        </li>
        <li className="flex items-start gap-2.5">
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-primary mt-0.5 shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-medium text-foreground block">Ringkasan & Flashcards</span>
            Generate ringkasan otomatis dan buat kartu pintar dari dokumen Anda.
          </div>
        </li>
        <li className="flex items-start gap-2.5">
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-primary mt-0.5 shrink-0">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-medium text-foreground block">Latihan Quiz</span>
            Uji pemahaman materi Anda dengan kuis pilihan ganda interaktif.
          </div>
        </li>
      </ul>

      <Link
        href="/workspaces"
        className="block w-full text-center text-sm font-medium bg-primary text-primary-foreground py-2.5 rounded-lg hover:bg-primary/90 transition-all duration-150 shadow-sm mt-2"
      >
        Pilih Workspace Anda
      </Link>
    </Card>
  )
}
