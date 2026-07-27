"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTransition } from "react"
import { Filter } from "lucide-react"

const FILTER_OPTIONS = [
  { value: "ALL",                label: "Semua Aktivitas"   },
  { value: "GENERATE_FLASHCARD", label: "Generate Flashcard" },
  { value: "GENERATE_QUIZ",      label: "Generate Quiz"      },
  { value: "GENERATE_SUMMARY",   label: "Generate Summary"   },
  { value: "ASSISTANT_CHAT",     label: "Assistant Chat"     },
]

/**
 * Dropdown filter jenis aktivitas di halaman History.
 * State berbasis URL (searchParams) — konsisten dengan WorkspaceControls.
 */
export function HistoryFilter() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const current = searchParams.get("type") || "ALL"

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "ALL") {
      params.set("type", value)
    } else {
      params.delete("type")
    }
    params.set("page", "1")
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Filter berdasarkan jenis aktivitas:
      </span>
      <div className="relative flex-shrink-0">
        <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <select
          value={current}
          onChange={(e) => handleChange(e.target.value)}
          className="h-10 pl-8 pr-7 text-sm rounded-lg border border-border bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition min-w-[180px]"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
