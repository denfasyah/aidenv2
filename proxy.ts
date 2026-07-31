import { type NextRequest } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

/**
 * Next.js 16 Proxy — menggantikan konvensi middleware.ts yang lama.
 * Berfungsi untuk me-refresh kuki sesi Supabase pada setiap request.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Jalankan proxy di semua path KECUALI:
     * - _next/static (file statis)
     * - _next/image (image optimization)
     * - favicon.ico
     * - berkas aset gambar di public
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
