"use client"

import { motion } from "framer-motion"

const steps = [
  { step: "01", title: "Buat Akun", description: "Daftar dalam detik menggunakan email atau langsung dengan akun Google Anda." },
  { step: "02", title: "Buat Workspace", description: "Organisasikan materi berdasarkan topik atau mata pelajaran dalam Workspace tersendiri." },
  { step: "03", title: "Generate AI", description: "Pilih jenis konten (Flashcard, Quiz, atau Ringkasan) dan biarkan AI mengerjakannya." },
  { step: "04", title: "Belajar & Track", description: "Pelajari konten yang dihasilkan, tulis catatan, dan pantau progress Anda di Dashboard." },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">Cara Kerja</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground">Mulai Belajar dalam 4 Langkah</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, i) => (
            <motion.div 
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative flex flex-col gap-5 group items-start text-left rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                {item.step}
              </div>
              
              <div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
