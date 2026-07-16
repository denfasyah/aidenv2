"use client"

import { Clock, Globe, Blocks, Zap } from "lucide-react"
import { motion } from "framer-motion"

export function Stats() {
  const stats = [
    { value: "< 5s", label: "Waktu Generate AI", icon: <Zap className="h-5 w-5 text-primary" /> },
    { value: "24/7", label: "Asisten Belajar", icon: <Clock className="h-5 w-5 text-primary" /> },
    { value: "1", label: "Aplikasi Terpusat", icon: <Blocks className="h-5 w-5 text-primary" /> },
    { value: "Tak Terbatas", label: "Potensi Belajar", icon: <Globe className="h-5 w-5 text-primary" /> },
  ]
  
  return (
    <section className="border-y border-border/50 bg-background/30 backdrop-blur-md py-12 px-4 sm:px-6 relative z-10">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s, i) => (
          <motion.div 
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {s.value}
            </div>
            <div className="flex items-center gap-1.5">
              {s.icon}
              <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
