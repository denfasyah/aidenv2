"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui"
import { motion } from "framer-motion"

export function Cta() {
  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-md p-10 sm:p-16 text-center flex flex-col items-center gap-6"
        >
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
            Siap Belajar Lebih <span className="text-primary">Efektif?</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Bergabunglah dengan ribuan pelajar yang sudah menggunakan Aiden. 
            Gratis, modern, dan siap membantu Anda mencapai nilai terbaik.
          </p>
          <div className="mt-4">
            <Link href="/register">
              <Button size="lg" className="rounded-full gap-2 px-10 h-14 text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                Mulai Gratis Sekarang
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
