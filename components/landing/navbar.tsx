"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, ArrowRight, Menu, X } from "lucide-react"
import { Button } from "@/components/ui"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: "Beranda", href: "#" },
    { label: "Tentang", href: "#about" },
    { label: "Fitur", href: "#features" },
    { label: "Cara Kerja", href: "#how-it-works" },
  ]

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">Aiden</span>
        </Link>

        {/* Nav Links - Desktop */}
        <nav className="hidden md:flex items-center gap-2 pl-8 flex-1 justify-center">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions - Desktop & Mobile */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="rounded-full">Masuk</Button>
          </Link>
          <Link href="/register" className="hidden sm:flex">
            <Button size="sm" className="rounded-full shadow-md shadow-primary/20 gap-1.5">
              Mulai Gratis
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          
          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex flex-col px-4 py-4 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/40 sm:hidden">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center rounded-xl h-12">Masuk</Button>
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full justify-center rounded-xl h-12 gap-2">
                    Mulai Gratis
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
