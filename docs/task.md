# Daftar Tugas (Task List) - Aiden v2 (Kronologis)

Dokumen ini memuat langkah pengerjaan E2E secara berurutan sesuai alur pengembangan (Development Flow).

## Fase 1: Setup Infrastruktur & Database
- [x] **[AGENT]** Inisialisasi Next.js, Tailwind, dan utilitas dasar.
- [ ] **[USER]** Jalankan skrip `supabase-schema.sql` terbaru di SQL Editor (Berisi 10 tabel, termasuk perubahan `users`).
- [x] **[AGENT]** Buat ulang `types/database.types.ts` agar selaras dengan tabel `users` yang baru.

## Fase 2: Sistem Desain Visual & Komponen UI Inti
- [ ] **[AGENT]** Konfigurasi `app/globals.css` untuk warna Primary Green dan dukungan Dark/Light mode.
- [ ] **[AGENT]** Setup `providers/theme-provider.tsx` dan `lib/utils.ts`.
- [ ] **[AGENT]** Rakit UI Components dasar (`Button`, `Input`, `Card`, `Modal`) di `components/ui/`.

## Fase 3: Landing Page (Halaman Utama)
- [ ] **[AGENT]** Desain Hero Section di `app/page.tsx` (Slogan, Deskripsi).
- [ ] **[AGENT]** Desain bagian Fitur (Penjelasan AI Assistant, Flashcard).
- [ ] **[AGENT]** Tambahkan navigasi statis ke `/login` dan `/register`.

## Fase 4: Autentikasi (Login & Register)
- [ ] **[USER]** Aktifkan Google OAuth di Supabase dan atur Client ID.
- [ ] **[AGENT]** Siapkan Klien Supabase (`lib/supabase/server.ts` & `client.ts`).
- [ ] **[AGENT]** Bangun `app/(auth)/login/page.tsx` dan `register/page.tsx` (Formulir modern berbasis Card).
- [ ] **[AGENT]** Integrasikan fungsi Sign In/Up Email dan Tombol Google OAuth.
- [ ] **[AGENT]** Buat `middleware.ts`. Atur rute perlindungan (`/dashboard`, `/admin`) berdasarkan pengecekan tabel `users.role`.

## Fase 5: User Dashboard (Ruang Pribadi)
- [ ] **[AGENT]** Bangun *Top Navbar* (`components/layout/top-navbar.tsx`) berisi Lonceng Notifikasi dan Profil.
- [ ] **[AGENT]** Bangun *Sidebar User* (`components/layout/user-sidebar.tsx`) berisi: Dashboard, Workspaces, Assistant, Notes, History.
- [ ] **[AGENT]** Terapkan layout di `app/(main)/layout.tsx`.
- [ ] **[AGENT]** Buat halaman `/dashboard` yang menampilkan statistik dari database (Total Flashcards, dsb) dan *Feed* singkat dari Activity Logs.

## Fase 6: Admin Dashboard (Panel Kendali)
- [ ] **[USER]** Masukkan `SUPABASE_SERVICE_ROLE_KEY` ke `.env.local`.
- [ ] **[AGENT]** Buat `lib/supabase/admin.ts` untuk mem-bypass RLS.
- [ ] **[AGENT]** Bangun *Sidebar Admin* (`components/layout/admin-sidebar.tsx`) berisi: Dashboard, Manage Users, Broadcast, System Config.
- [ ] **[AGENT]** Terapkan layout di `app/(admin)/layout.tsx`.
- [ ] **[AGENT]** Buat halaman `/admin/dashboard` yang menarik data *Global Stats* (Total Users seluruh platform, dll).
- [ ] **[AGENT]** Buat `/admin/users` untuk merender tabel daftar semua pengguna dari tabel `users`.
- [ ] **[AGENT]** Buat `/admin/broadcast` dengan form untuk mengirim Notifikasi massal (Insert ke tabel `notifications`).

## Fase 7: Core Fitur (Aktivitas Utama)
- [ ] **[AGENT]** Halaman **Workspaces**: CRUD ruang kerja belajar.
- [ ] **[AGENT]** Halaman **Notes**: Integrasi Text Editor untuk catatan manual, simpan ke tabel `notes`.
- [ ] **[AGENT]** Halaman **History**: Tabel/Timeline memanggil dari `activity_logs`.
- [ ] **[AGENT]** Halaman **Assistant**: ChatBox AI. Jika diakses via sidebar, jalankan fungsi *Global Chat* (`workspace_id IS NULL`).

## Fase 8: Integrasi AI & Activity Logging
- [ ] **[AGENT]** Buat Route Handlers `/api/generate` (Google Gemini JSON).
- [ ] **[AGENT]** Logika Database Transaksional: Simpan hasil AI ke `flashcards`/`quizzes` sekaligus simpan riwayat ke `activity_logs` di waktu yang sama.
- [ ] **[AGENT]** Buat komponen *Flashcard Viewer* untuk men-render JSON dari database ke antarmuka pengguna.
- [ ] **[AGENT]** Buat Route Handlers `/api/chat` (Streaming AI Response).

## Fase 9: Testing & Bug Fixes
- [ ] **[USER / AGENT]** Pengujian alur (Buat akun -> Akses Dashboard User -> Jadikan akun tersebut Admin di DB -> Akses Dashboard Admin).
- [ ] **[AGENT]** Pengecekan responsivitas UI dan warna Dark Mode.
- [ ] **[AGENT]** Resolusi peringatan TypeScript/Linting.

## Fase 10: Deployment
- [ ] **[USER]** Inisialisasi Git dan Push ke GitHub/GitLab.
- [ ] **[USER]** Hubungkan repo ke **Vercel**.
- [ ] **[USER]** Tambahkan seluruh Environment Variables di setting Vercel (`URL`, `Anon Key`, `Service Role`, `Gemini API`).
- [ ] **[USER/AGENT]** Verifikasi produksi (astikan OAuth Redirect URL mengarah ke URL Vercel).
