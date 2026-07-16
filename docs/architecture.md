# Arsitektur & Teknis - Aiden v2

## 1. Arsitektur Sistem Utama
Aiden v2 menggunakan arsitektur *Serverless* yang solid:
- **Client-Side:** Next.js (App Router), Tailwind CSS.
- **Server-Side & API:** Next.js Route Handlers & Server Actions.
- **Database & Auth:** Supabase (menggunakan `public.users` yang berelasi dengan `auth.users`).
- **Keamanan (RBAC):** Middleware memisahkan `/admin` dan `/dashboard`. Admin Dashboard menggunakan *Service Role Key* untuk mem-bypass RLS.

## 2. Struktur Folder Detail & Komprehensif
Struktur ini dirancang agar siap diskalakan (scalable) dan memisahkan tugas UI, logika, dan penyedia data secara ketat.

```text
aidenv2/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Group: Autentikasi
│   │   ├── login/page.tsx            # Halaman Login
│   │   ├── register/page.tsx         # Halaman Daftar
│   │   └── layout.tsx                # Layout khusus form auth (Centered)
│   ├── (main)/                       # Group: User Biasa
│   │   ├── dashboard/page.tsx        # Dashboard (Stats & Info)
│   │   ├── workspace/[id]/page.tsx   # Detail Workspace
│   │   ├── notes/page.tsx            # Daftar Semua Notes
│   │   ├── history/page.tsx          # Daftar Aktivitas Penuh
│   │   ├── assistant/page.tsx        # Halaman AI Chat
│   │   └── layout.tsx                # Layout dengan User Sidebar & Navbar
│   ├── (admin)/                      # Group: Khusus Admin
│   │   ├── admin/dashboard/page.tsx  # Statistik Platform Global
│   │   ├── admin/users/page.tsx      # Manajemen Pengguna
│   │   ├── admin/broadcast/page.tsx  # Kirim Notifikasi Global
│   │   └── layout.tsx                # Layout dengan Admin Sidebar
│   ├── api/                          # Route Handlers
│   │   ├── generate/route.ts         # Endpoint Gemini API
│   │   └── chat/route.ts             # Endpoint Vercel AI Streaming
│   ├── globals.css                   # Tailwind CSS Variables
│   ├── layout.tsx                    # Root Layout (Inject ThemeProvider)
│   └── page.tsx                      # Landing Page Utama
├── components/                       
│   ├── ui/                           # Komponen Reusable Murni (Shadcn UI style)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── dialog.tsx
│   ├── layout/                       # Komponen Navigasi Dasar
│   │   ├── user-sidebar.tsx          # Sidebar untuk User
│   │   ├── admin-sidebar.tsx         # Sidebar untuk Admin
│   │   └── top-navbar.tsx            # Navbar (Profile & Lonceng Notif)
│   └── features/                     # Komponen Kompleks Penuh Logika
│   │   ├── auth-form.tsx             # Form Login/Register
│   │   ├── flashcard-viewer.tsx      # Visualisasi JSON Flashcard
│   │   └── chat-box.tsx              # Kotak Pesan Assistant
├── hooks/                            # Custom React Hooks
│   ├── use-workspace.ts              # Fetching State Workspace
│   └── use-chat.ts                   # Logika Streaming Teks AI
├── lib/                              
│   ├── utils.ts                      # tailwind-merge (cn)
│   ├── gemini.ts                     # Konfigurasi SDK Google Gemini
│   └── supabase/                     # Inisialisasi Klien Supabase
│       ├── client.ts                 # Untuk Klien Browser (Anon Key)
│       ├── server.ts                 # Untuk Komponen Server (Anon Key)
│       └── admin.ts                  # KHUSUS Admin Actions (Service Role Key)
├── providers/                        
│   └── theme-provider.tsx            # next-themes wrapper
├── types/                            
│   └── database.types.ts             # Tipe Skema TypeScript Database
└── docs/                             # Dokumen Proyek Aiden V2
```

## 3. Desain Skema Database (Tabel Users)
Tabel utama kita di skema publik bernama `users` (dulu `profiles`). Ini memastikan nama lebih intuitif dan standar.
- **`users` (public schema)**: `id` berelasi 1-to-1 dengan `auth.users(id)`. Menyimpan `role` (user/admin), `full_name`, `avatar_url`.
- Semua tabel lain (`workspaces`, `flashcards`, dll) mengambil rujukan *Foreign Key* ke tabel `public.users` ini.
