"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { Search, SlidersHorizontal } from "lucide-react"

export function WorkspaceControls() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Controlled states synced with URL
  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest")

  // Sync local state if URL changes externally (e.g. browser back/forward)
  useEffect(() => {
    setSearch(searchParams.get("search") ?? "")
    setSort(searchParams.get("sort") ?? "newest")
  }, [searchParams])

  // Debounced push to URL for search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (search) {
        params.set("search", search)
      } else {
        params.delete("search")
      }
      params.set("page", "1")
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Cari workspace..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 h-10 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
        />
      </div>

      {/* Sort Dropdown — controlled via value */}
      <div className="relative flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <select
          value={sort}
          onChange={(e) => handleSort(e.target.value)}
          className="h-10 pl-3 pr-8 text-sm rounded-lg border border-border bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition"
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
