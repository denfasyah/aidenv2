import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * Route Handler untuk callback OAuth dan Magic Link.
 * Supabase redirect ke sini setelah Google OAuth selesai.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Tambahkan param success=true agar dashboard tahu user baru login
      return NextResponse.redirect(`${origin}${next}?success=true`)
    }
  }

  // Jika gagal, redirect ke halaman error atau login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
