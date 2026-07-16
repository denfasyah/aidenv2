"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui"
import { motion } from "framer-motion"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:pt-32 lg:pb-28 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-8 relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Platform Belajar Berbasis AI
        </motion.div>

        {/* Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-foreground leading-[1.1] tracking-tight"
        >
          Belajar Lebih Cerdas,{" "}
          <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
            Bukan Lebih Keras
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-muted-foreground text-lg sm:text-xl max-w-2xl leading-relaxed"
        >
          Aiden mengubah cara Anda belajar. Organisasikan materi dalam Workspace, 
          biarkan AI membuat Flashcard, Quiz, dan Ringkasan otomatis dalam hitungan detik.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-4"
        >
          <Link href="/register">
            <Button size="lg" className="rounded-full gap-2 min-w-48 shadow-lg shadow-primary/25 h-12 px-8 text-base">
              Coba Gratis Sekarang
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="rounded-full min-w-48 h-12 px-8 text-base bg-background/50 backdrop-blur-sm border-border/50">
              Sudah Punya Akun?
            </Button>
          </Link>
        </motion.div>

        {/* Trust Pills */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-4"
        >
          {["Gratis untuk memulai", "Tidak perlu kartu kredit", "Aman & Terlindungi"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary/80" />
              {t}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
