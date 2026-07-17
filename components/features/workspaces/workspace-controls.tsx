"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useTransition, useRef, useEffect } from "react"
import { Search, SlidersHorizontal } from "lucide-react"

export function WorkspaceControls() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Local state for immediate UI update
  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest")

  // Sync local state if URL changes externally (e.g., pagination or back button)
  useEffect(() => {
    setSearch(searchParams.get("search") ?? "")
    setSort(searchParams.get("sort") ?? "newest")
  }, [searchParams])

  const handleSearch = (value: string) => {
    setSearch(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set("search", value)
      } else {
        params.delete("search")
      }
      params.set("page", "1") // reset page
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    }, 400)
  }

  const handleSort = (value: string) => {
    setSort(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "newest") {
      params.set("sort", value)
    } else {
      params.delete("sort")
    }
    params.set("page", "1")
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
      {/* Search */}
      <div className="relative flex-1 sm:flex-none sm:w-[320px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Cari workspace..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-8 pr-3 h-10 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
        />
      </div>

      {/* Sort Dropdown */}
      <div className="relative flex-shrink-0">
        <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <select
          value={sort}
          onChange={(e) => handleSort(e.target.value)}
          className="h-10 pl-8 pr-7 text-sm rounded-lg border border-border bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition"
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="favorite">Terfavorit</option>
          <option value="az">A → Z</option>
        </select>
      </div>
    </div>
  )
}
