import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { About } from "@/components/landing/about"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Stats } from "@/components/landing/stats"
import { Cta } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"
import { BackgroundPattern } from "@/components/landing/background-pattern"

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
