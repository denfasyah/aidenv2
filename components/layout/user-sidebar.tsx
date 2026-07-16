"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  BookOpen, 
  LayoutDashboard, 
  FolderKanban, 
  Bot, 
  NotebookPen, 
  History,
  LogOut
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui"
import { showAlert } from "@/lib/swal"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workspaces", href: "/workspaces", icon: FolderKanban },
  { label: "Assistant", href: "/assistant", icon: Bot },
  { label: "Notes", href: "/notes", icon: NotebookPen },
  { label: "History", href: "/history", icon: History },
]

export function UserSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    const result = await showAlert.confirm(
      "Keluar Aplikasi",
      "Apakah Anda yakin ingin keluar dari akun ini?",
      "Ya, Keluar",
      "Batal"
    )

    if (result.isConfirmed) {
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <aside className="w-64 border-r border-border/40 bg-sidebar flex flex-col h-screen hidden md:flex sticky top-0">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sidebar-accent flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-sidebar-accent-foreground" />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground tracking-tight">Aiden</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn(
                "h-4 w-4", 
                isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
              )} />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Footer Area (Logout) */}
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
