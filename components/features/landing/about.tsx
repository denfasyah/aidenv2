"use client"

import { BookOpen, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"

export function About() {
  return (
    <section id="about" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Text Content */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6"
        >
          <div className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 w-fit">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Tentang Aiden</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-tight">
            Asisten yang Benar-benar <br/> <span className="text-primary">Memahami Anda</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Aiden lahir dari satu misi: membuat belajar menjadi lebih personal, efisien, dan interaktif. 
            Dengan kecerdasan buatan, Aiden bukan sekadar alat pembantu—ini adalah partner studi Anda yang siap sedia.
          </p>
          <ul className="flex flex-col gap-4 mt-2">
            {[
              "Dibuat untuk pelajar, mahasiswa, dan profesional",
              "AI menganalisis materi spesifik di Workspace Anda",
              "Antarmuka yang bersih tanpa distraksi berlebihan",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-foreground">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm sm:text-base">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Visual Showcase (Glassmorphism Mockup) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          {/* Subtle Glow Behind Card */}
          <div className="absolute inset-0 bg-primary/10 blur-[100px] -z-10 rounded-full" />
          
          <div className="rounded-3xl border border-border/80 bg-background/80 backdrop-blur-2xl p-6 md:p-8 shadow-xl shadow-primary/5 flex flex-col gap-5">
            <div className="flex items-center gap-4 pb-5 border-b border-border/60">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-lg text-foreground">Workspace: Biologi Sel</p>
                <p className="text-sm text-muted-foreground">Aktif • 4 Konten tersimpan</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                { label: "Flashcard: Struktur DNA", type: "AI Generated" },
                { label: "Quiz: Mitosis & Meiosis", type: "AI Generated" },
                { label: "Catatan: Siklus Krebs", type: "Manual" },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-card/60 hover:bg-card transition-colors border border-border/40 shadow-sm"
                >
                  <span className="font-medium text-foreground text-sm sm:text-base">{item.label}</span>
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold whitespace-nowrap">
                    {item.type}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
