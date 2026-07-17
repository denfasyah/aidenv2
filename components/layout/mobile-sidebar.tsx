"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui"
import { cn } from "@/lib/utils"
import { USER_NAV_ITEMS } from "@/components/layout/nav-config"

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Sidebar yang muncul dari kiri di layar mobile (< md).
 * Dipisahkan dari TopNavbar agar masing-masing file fokus pada satu tanggung jawab.
 */
export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay / Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="fixed top-0 left-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border z-50 md:hidden flex flex-col"
          >
            {/* Header Logo */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border shrink-0">
              <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
                <div className="w-8 h-8 rounded-xl bg-sidebar-accent flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-sidebar-accent-foreground" />
                </div>
                <span className="font-bold text-lg text-sidebar-foreground tracking-tight">Aiden</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5 text-sidebar-foreground" />
              </Button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1.5 custom-scrollbar">
              {USER_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
