# Daftar Tugas (Task List) - Aiden v2 (Kronologis)

Dokumen ini memuat langkah pengerjaan E2E secara berurutan sesuai alur pengembangan (Development Flow).

## Fase 1: Setup Infrastruktur & Database
- [x] **[AGENT]** Inisialisasi Next.js, Tailwind, dan utilitas dasar.
- [ x] **[USER]** Jalankan skrip `supabase-schema.sql` terbaru di SQL Editor (Berisi 10 tabel, termasuk perubahan `users`).
- [x] **[AGENT]** Buat ulang `types/database.types.ts` agar selaras dengan tabel `users` yang baru.

## Fase 2: Sistem Desain Visual & Komponen UI Inti
- [x] **[AGENT]** Konfigurasi `app/globals.css` untuk warna Primary Green dan dukungan Dark/Light mode (CSS Variables penuh).
- [x] **[AGENT]** Setup `providers/theme-provider.tsx`, `lib/utils.ts`, dan `components/layout/theme-toggle.tsx`.
- [x] **[AGENT]** Rakit UI Components dasar (`Button`, `Input`, `Textarea`, `Card`, `Badge`, `Separator`) di `components/ui/index.tsx`.
- [x] **[AGENT]** Buat komponen Skeleton (`components/ui/skeleton.tsx`): StatCard, TableRow, Activity, WorkspaceCard, ChatMessage.
- [x] **[AGENT]** Buat halaman `app/loading.tsx` (global loading state).
- [x] **[AGENT]** Buat halaman `app/not-found.tsx` (halaman 404).

## Fase 3: Landing Page (Halaman Utama)
- [x] **[AGENT]** Desain Navbar sticky dengan backdrop blur, logo, link navigasi, dan ThemeToggle.
- [x] **[AGENT]** Desain Hero Section (`app/page.tsx`) dengan badge, headline, subheading, dan CTA buttons.
- [x] **[AGENT]** Desain Features Section (6 kartu fitur dalam grid responsif).
- [x] **[AGENT]** Desain "How It Works" Section (4 langkah).
- [x] **[AGENT]** Desain CTA Section dan Footer.

## Fase 4: Autentikasi (Supabase Auth)
- [x] **[USER]** Setup proyek Supabase.
- [x] **[USER]** Setup Google OAuth Client ID & Secret di GCP.
- [x] **[USER]** Konfigurasi Google Provider di dashboard Supabase.
- [x] **[USER]** Setup `.env.local` dengan anon key & url Supabase.
- [x] **[AGENT]** Buat instance klien Supabase (`client`, `server`, dan `middleware`).
- [x] **[AGENT]** Buat halaman Login (`/login`) dengan desain modern (mendukung form & tombol OAuth).
- [x] **[AGENT]** Buat halaman Register (`/register`) (form & tombol OAuth).
- [x] **[AGENT]** Buat Auth Callback Handler untuk memproses token OAuth ke sesi.
- [x] **[AGENT]** Implementasikan Middleware Next.js untuk memproteksi *private routes* (`/dashboard`, dll) dan redirect otomatis jika belum login.

## Fase 5: User Dashboard (Ruang Pribadi)
- [x] **[AGENT]** Bangun *Top Navbar* (`components/layout/top-navbar.tsx`) berisi Lonceng Notifikasi dan Profil.
- [x] **[AGENT]** Bangun *Sidebar User* (`components/layout/user-sidebar.tsx`) berisi: Dashboard, Workspaces, Assistant, Notes, History.
- [x] **[AGENT]** Terapkan layout di `app/(dashboard)/layout.tsx`.
- [x] **[AGENT]** Buat halaman `/dashboard` yang menampilkan statistik dari database (Total Flashcards, dsb) dan *Feed* singkat dari Activity Logs.

## Fase 6: Core Fitur (Aktivitas Utama)
- [ ] **[AGENT]** Halaman **Workspaces**: CRUD ruang kerja belajar.
- [ ] **[AGENT]** Halaman **Notes**: Integrasi Text Editor untuk catatan manual, simpan ke tabel `notes`.
- [ ] **[AGENT]** Halaman **History**: Tabel/Timeline memanggil dari `activity_logs`.
- [ ] **[AGENT]** Halaman **Assistant**: ChatBox AI. Jika diakses via sidebar, jalankan fungsi *Global Chat* (`workspace_id IS NULL`).

## Fase 7: Admin Dashboard (Panel Kendali)
- [ ] **[USER]** Masukkan `SUPABASE_SERVICE_ROLE_KEY` ke `.env.local`.
- [ ] **[AGENT]** Buat `lib/supabase/admin.ts` untuk mem-bypass RLS.
- [ ] **[AGENT]** Bangun *Sidebar Admin* (`components/layout/admin-sidebar.tsx`) berisi: Dashboard, Manage Users, Broadcast, System Config.
- [ ] **[AGENT]** Terapkan layout di `app/(admin)/layout.tsx`.
- [ ] **[AGENT]** Buat halaman `/admin/dashboard` yang menarik data *Global Stats* (Total Users seluruh platform, dll).
- [ ] **[AGENT]** Buat `/admin/users` untuk merender tabel daftar semua pengguna dari tabel `users`.
- [ ] **[AGENT]** Buat `/admin/broadcast` dengan form untuk mengirim Notifikasi massal (Insert ke tabel `notifications`).

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
