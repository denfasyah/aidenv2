import type { Metadata } from "next"
import { AuthCard, AuthDivider } from "@/components/auth/auth-card"
import { GoogleButton } from "@/components/auth/google-button"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun Aiden gratis dan mulai belajar lebih cerdas dengan AI.",
}

/**
 * Halaman Register — Server Component bersih.
 * Semua interaktivitas ada di komponen child (client components).
 */
export default function RegisterPage() {
  return (
    <AuthCard
      title="Buat Akun Baru"
      subtitle="Mulai perjalanan belajar Anda bersama Aiden"
    >
      <GoogleButton label="Daftar dengan Google" />
      <AuthDivider label="atau daftar dengan email" />
      <RegisterForm />
    </AuthCard>
  )
}
