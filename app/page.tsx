import { Navbar } from "@/components/features/landing/navbar"
import { Hero } from "@/components/features/landing/hero"
import { About } from "@/components/features/landing/about"
import { Features } from "@/components/features/landing/features"
import { HowItWorks } from "@/components/features/landing/how-it-works"
import { Stats } from "@/components/features/landing/stats"
import { Cta } from "@/components/features/landing/cta"
import { Footer } from "@/components/features/landing/footer"
import { BackgroundPattern } from "@/components/features/landing/background-pattern"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col selection:bg-primary/20">
      <BackgroundPattern />
      <Navbar />
      
      <main className="flex-1 flex flex-col">
        <Hero />
        <About />
        <Stats />
        <Features />
        <HowItWorks />
        <Cta />
      </main>

      <Footer />
    </div>
  )
}
