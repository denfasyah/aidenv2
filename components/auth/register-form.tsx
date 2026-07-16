"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react"
import { Button, Input } from "@/components/ui"
import { createClient } from "@/utils/supabase/client"
import { motion } from "framer-motion"
import { showAlert } from "@/lib/swal"

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "", password: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validasi Lengkap
    if (!form.name || !form.email || !form.password) {
      showAlert.error("Validasi Gagal", "Semua kolom wajib diisi.")
      return
    }
    if (form.password.length < 8) {
      showAlert.error("Password Lemah", "Password minimal harus 8 karakter.")
      return
    }

    setIsLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setIsLoading(false)
      showAlert.error("Pendaftaran Gagal", error.message || "Gagal mendaftar. Silakan coba lagi.")
      return
    }

    setSuccess(form.email)
    setIsLoading(false)
  }

  // Success state — tampilkan pesan konfirmasi email
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5 text-center py-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">Cek Email Anda!</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Link konfirmasi telah dikirim ke{" "}
            <strong className="text-foreground">{success}</strong>.
            Klik link tersebut untuk mengaktifkan akun.
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="mt-2">Kembali ke Login</Button>
        </Link>
      </motion.div>
    )
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
        id="register-name"
        type="text"
        label="Nama Lengkap"
        placeholder="Nama Anda"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        leftIcon={<User className="h-4 w-4" />}
        autoComplete="name"
      />
      <Input
        id="register-email"
        type="email"
        label="Email"
        placeholder="nama@email.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        leftIcon={<Mail className="h-4 w-4" />}
        autoComplete="email"
      />
      <div className="relative">
        <Input
          id="register-password"
          type={showPassword ? "text" : "password"}
          label="Password"
          placeholder="Minimal 8 karakter"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          leftIcon={<Lock className="h-4 w-4" />}
          autoComplete="new-password"
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

      <Button
        type="submit"
        id="btn-register-submit"
        className="w-full h-11 gap-2 mt-2"
        isLoading={isLoading}
      >
        Buat Akun
        <ArrowRight className="h-4 w-4" />
      </Button>

      <p className="text-center text-sm text-muted-foreground mt-2">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Masuk di sini
        </Link>
      </p>
    </motion.form>
  )
}
