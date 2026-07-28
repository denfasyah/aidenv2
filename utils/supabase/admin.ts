import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

/**
 * Admin / Service-Role Supabase client.
 * Melewati RLS sepenuhnya — HANYA untuk operasi server-side internal
 * seperti insert notifikasi lintas tabel yang tidak memerlukan context user.
 *
 * Membutuhkan env SUPABASE_SERVICE_ROLE_KEY (bukan ANON_KEY).
 * Fallback ke anon key jika service role key tidak ada (insert akan kena RLS).
 */
export function createAdminClient() {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
