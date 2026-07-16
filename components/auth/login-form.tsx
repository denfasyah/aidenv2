"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react"
import { Button, Input } from "@/components/ui"
import { createClient } from "@/utils/supabase/client"
import { motion } from "framer-motion"

/**
 * Form Login interaktif (Client Component).
 * Dipisah dari page.tsx agar page bisa menjadi Server Component.
 */
export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ email: "", password: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setError("Email atau password salah. Silakan coba lagi.")
      setIsLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <Input
        id="login-email"
        type="email"
        label="Email"
        placeholder="nama@email.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        leftIcon={<Mail className="h-4 w-4" />}
        required
        autoComplete="email"
      />

      <div className="flex flex-col gap-1.5">
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="Masukkan password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            leftIcon={<Lock className="h-4 w-4" />}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[calc(50%+10px)] -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Link href="/forgot-password" className="text-xs text-primary hover:underline self-end">
          Lupa password?
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        type="submit"
        id="btn-login-submit"
        className="w-full h-11 gap-2 mt-1"
        isLoading={isLoading}
      >
        Masuk
        <ArrowRight className="h-4 w-4" />
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/register" className="text-primary font-semibold hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </motion.form>
  )
}
