"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { showAlert } from "@/lib/swal"

/**
 * Custom hook untuk logout terpusat.
 * Digunakan oleh UserSidebar dan TopNavbar agar logika tidak duplikat.
 */
export function useLogout() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    const result = await showAlert.confirm(
      "Keluar Aplikasi",
      "Apakah Anda yakin ingin keluar dari akun ini?",
      "Ya, Keluar",
      "Batal"
    )

    if (result.isConfirmed) {
      await supabase.auth.signOut()
      showAlert.success("Berhasil Keluar", "Anda telah keluar dari aplikasi.")
      router.push("/login")
      router.refresh()
    }
  }

  return { handleLogout }
}
