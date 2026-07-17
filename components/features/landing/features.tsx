"use client"

import {
  LayoutDashboard,
  Zap,
  BrainCircuit,
  NotebookPen,
  MessageSquare,
  BookOpen,
} from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    icon: LayoutDashboard,
    title: "Workspace Terpusat",
    description: "Kelompokkan materi ke Workspace tersendiri. Rapi dan terstruktur.",
  },
  {
    icon: Zap,
    title: "AI Flashcard & Quiz",
    description: "AI otomatis membuat set Flashcard dan Soal Latihan siap pakai dalam detik.",
  },
  {
    icon: BrainCircuit,
    title: "Ringkasan Cerdas",
    description: "Ubah teks panjang menjadi ringkasan padat untuk review sebelum ujian.",
  },
  {
    icon: NotebookPen,
    title: "Catatan Pribadi",
    description: "Tulis catatan manual di dalam Workspace tanpa berpindah aplikasi.",
  },
  {
    icon: MessageSquare,
    title: "AI Chat Assistant",
    description: "Tanya AI secara langsung. Mode Chat memahami konteks materi Workspace.",
  },
  {
    icon: BookOpen,
    title: "Riwayat & History",
    description: "Seluruh aktivitas tercatat rapi. Review konten yang pernah dibuat kapan saja.",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">Fitur Unggulan</span>
          <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">Semua yang Anda Butuhkan</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg">
            Platform pembelajaran lengkap. Dari membuat materi hingga menguji pemahaman — semuanya ditenagai AI.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="group rounded-2xl border border-border/60 bg-card p-6 flex flex-col gap-4 hover:border-primary/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <f.icon className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
