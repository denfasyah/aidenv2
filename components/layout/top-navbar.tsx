"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Bell, Menu, User, LogOut, Settings, LayoutDashboard, FolderKanban, Bot, NotebookPen, History, X, BookOpen } from "lucide-react"
import { Button } from "@/components/ui"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { showAlert } from "@/lib/swal"
import { createClient } from "@/utils/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

interface TopNavbarProps {
  userEmail?: string
  userName?: string
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workspaces", href: "/workspaces", icon: FolderKanban },
  { label: "Assistant", href: "/assistant", icon: Bot },
  { label: "Notes", href: "/notes", icon: NotebookPen },
  { label: "History", href: "/history", icon: History },
]

export function TopNavbar({ userEmail, userName }: TopNavbarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  // Deteksi login sukses dari URL (Google OAuth)
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      showAlert.success("Berhasil Masuk", "Selamat datang kembali di Aiden!")
      // Hapus param dari URL agar tidak muncul terus saat direfresh
      router.replace(pathname)
    }
  }, [searchParams, pathname, router])
  
  const getTitle = () => {
    const path = pathname.split('/')[1]
    if (!path) return "Dashboard"
    return path.charAt(0).toUpperCase() + path.slice(1)
  }

  const handleLogout = async () => {
    setShowProfileMenu(false)
    const result = await showAlert.confirm(
      "Keluar Aplikasi",
      "Apakah Anda yakin ingin keluar dari akun ini?",
      "Ya, Keluar",
      "Batal"
    )

    if (result.isConfirmed) {
      await supabase.auth.signOut()
      showAlert.success("Berhasil Keluar", "Anda telah keluar dari aplikasi.")
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <>
      <header className="h-16 border-b border-border/40 bg-background flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setShowMobileMenu(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground hidden sm:block">
            {getTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 relative">
          <ThemeToggle />
          
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border border-background"></span>
          </Button>

          <div className="flex items-center gap-3 pl-2 sm:pl-4 sm:border-l border-border/40 cursor-pointer" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <div className="hidden sm:flex flex-col items-end text-sm">
              <span className="font-medium text-foreground">{userName || "User"}</span>
              <span className="text-xs text-muted-foreground">{userEmail || ""}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 hover:bg-primary/30 transition-colors">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 mt-2 w-56 rounded-xl border border-border/50 bg-card shadow-lg overflow-hidden flex flex-col z-50"
              >
                <div className="p-4 border-b border-border/40 sm:hidden">
                   <p className="font-medium text-foreground truncate">{userName || "User"}</p>
                   <p className="text-xs text-muted-foreground truncate">{userEmail || ""}</p>
                </div>
                <div className="p-1">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-lg transition-colors">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Profil Saya
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-lg transition-colors">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Pengaturan
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors mt-1"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-sidebar border-r border-border/40 z-50 md:hidden flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border shrink-0">
                <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setShowMobileMenu(false)}>
                  <div className="w-8 h-8 rounded-xl bg-sidebar-accent flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-sidebar-accent-foreground" />
                  </div>
                  <span className="font-bold text-lg text-sidebar-foreground tracking-tight">Aiden</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setShowMobileMenu(false)} className="rounded-full">
                  <X className="h-5 w-5 text-sidebar-foreground" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1.5 custom-scrollbar">
                {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  const Icon = item.icon
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
