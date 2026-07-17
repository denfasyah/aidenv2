"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, LogOut } from "lucide-react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/utils"
import { USER_NAV_ITEMS } from "@/components/layout/nav-config"
import { useLogout } from "@/hooks/use-logout"

/**
 * Sidebar navigasi utama — hanya tampil di desktop (md ke atas).
 * Untuk mobile, lihat MobileSidebar.
 */
export function UserSidebar() {
  const pathname = usePathname()
  const { handleLogout } = useLogout()

  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar hidden md:flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sidebar-accent flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-sidebar-accent-foreground" />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground tracking-tight">Aiden</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1.5 custom-scrollbar">
        {USER_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 shrink-0",
                isActive
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
              )} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 h-10 px-3"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 text-sidebar-foreground/50" />
          Log Out
        </Button>
      </div>
    </aside>
  )
}
