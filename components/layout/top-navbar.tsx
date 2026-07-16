"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Bell, Menu, User, LogOut, Settings } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { showAlert } from "@/lib/swal"
import { useLogout } from "@/hooks/use-logout"

interface TopNavbarProps {
  userName?: string
  userEmail?: string
}

/**
 * Navbar atas dashboard — berisi breadcrumb, notifikasi, theme toggle, dan profil.
 * Logika Mobile Sidebar didelegasikan ke MobileSidebar.
 * Logika Logout didelegasikan ke useLogout hook.
 */
export function TopNavbar({ userName, userEmail }: TopNavbarProps) {
  const pathname      = usePathname()
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const { handleLogout } = useLogout()

  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // Deteksi login sukses dari URL setelah Google OAuth
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      showAlert.success("Berhasil Masuk", "Selamat datang kembali di Aiden!")
      router.replace(pathname)
    }
  }, [searchParams, pathname, router])

  // Judul halaman otomatis dari URL
  const pageTitle = (() => {
    const segment = pathname.split("/")[1]
    if (!segment) return "Dashboard"
    return segment.charAt(0).toUpperCase() + segment.slice(1)
  })()

  return (
    <>
      <header className="h-16 border-b border-border/40 bg-background flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shrink-0">
        {/* Kiri: Hamburger + Judul */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
        </div>

        {/* Kanan: Theme, Notifikasi, Profil */}
        <div className="flex items-center gap-1 sm:gap-2 relative">
          <ThemeToggle />

          {/* Lonceng Notifikasi */}
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border border-background" />
          </Button>

          {/* Area Profil */}
          <div
            className="flex items-center gap-3 pl-2 sm:pl-3 sm:border-l border-border/40 cursor-pointer select-none"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium text-foreground">{userName || "User"}</span>
              <span className="text-xs text-muted-foreground">{userEmail || ""}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 hover:bg-primary/30 transition-colors">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* Dropdown Profil */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-14 w-56 rounded-xl border border-border/50 bg-card shadow-xl overflow-hidden z-50"
                // Tutup dropdown jika klik di luar
                onBlur={() => setProfileOpen(false)}
              >
                {/* Info User (hanya muncul di mobile) */}
                <div className="p-4 border-b border-border/40 sm:hidden">
                  <p className="text-sm font-medium text-foreground truncate">{userName || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail || ""}</p>
                </div>

                <div className="p-1">
                  <DropdownItem icon={User} label="Profil Saya" onClick={() => setProfileOpen(false)} />
                  <DropdownItem icon={Settings} label="Pengaturan" onClick={() => setProfileOpen(false)} />
                  <DropdownItem
                    icon={LogOut}
                    label="Keluar"
                    destructive
                    onClick={() => { setProfileOpen(false); handleLogout() }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile Sidebar (terpisah) */}
      <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}

// ── Sub-komponen kecil untuk item dropdown ──
interface DropdownItemProps {
  icon: React.ElementType
  label: string
  onClick?: () => void
  destructive?: boolean
}

function DropdownItem({ icon: Icon, label, onClick, destructive }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted/50"
      )}
    >
      <Icon className={`h-4 w-4 ${destructive ? "" : "text-muted-foreground"}`} />
      {label}
    </button>
  )
}

import { cn } from "@/lib/utils"
