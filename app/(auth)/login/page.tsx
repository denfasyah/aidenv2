import type { Metadata } from "next"
import { AuthCard, AuthDivider } from "@/components/features/auth/auth-card"
import { GoogleButton } from "@/components/features/auth/google-button"
import { LoginForm } from "@/components/features/auth/login-form"

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun Aiden Anda dan lanjutkan perjalanan belajar.",
}

/**
 * Halaman Login — Server Component bersih.
 * Semua interaktivitas ada di komponen child (client components).
 */
export default function LoginPage() {
  return (
    <AuthCard
      title="Selamat Datang Kembali"
      subtitle="Masuk ke akun Aiden Anda"
    >
      <GoogleButton label="Lanjutkan dengan Google" />
      <AuthDivider />
      <LoginForm />
    </AuthCard>
  )
}
