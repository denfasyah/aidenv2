# Daftar Tugas (Task List) - Aiden v2 (Detail & Terstruktur)

Dokumen ini memuat langkah pengerjaan E2E secara berurutan sesuai alur pengembangan (Development Flow).
Setiap task wajib melalui 4 tahap pengerjaan: **UI/UX Design**, **API & DB Integration**, **State & Logic Handling**, serta **Testing & Verification**.

---

## 🟢 Selesai (Completed Tasks)

- [x] **Fase 1: Setup Infrastruktur & Database**
  - Schema Supabase (10 tabel), Types Generator, Next.js & Tailwind setup.
- [x] **Fase 2: Sistem Desain Visual & Komponen UI Inti**
  - Dark/Light Theme Provider, Base UI Components (Button, Card, Badge, Input, Skeleton, Modal).
- [x] **Fase 3: Landing Page (Halaman Utama)**
  - Navbar, Hero, Features, How It Works, CTA, Footer.
- [x] **Fase 4: Autentikasi (Supabase Auth)**
  - OAuth Google + Email/Password Login/Register, Middleware Protected Routes, Auth Callbacks.
- [x] **Fase 5: User Dashboard (Ruang Personal)**
  - Top Navbar, Sidebar, Overview Stats, Feed Activity Log.
- [x] **Fase 6.1: Workspaces & Workspace Detail**
  - CRUD Workspaces, Document Upload, Workspace Layout, PDF Viewer, dan Workspace AI Chat Panel (Client-side cache).

---

## 🟡 Task Mendatang (Next Implementation Checklist)

### 📌 TASK 1: Workspace Detail — Tab Summary (AI Summary Generator)
- [x] **[AGENT] Fitur AI Summary & History Persistence**
  - 🎨 **Design:** UI Tab `SUMMARY` di Workspace Detail. Tampilan Markdown Rapi (Heading, Key Points, Bullet List), Tombol "Generate / Re-generate Summary", Tombol Copy Text & Save to Notes.
  - ⚡ **API & DB:** 
    - API Route `/api/generate/summary` (Gemini API membaca PDF workspace).
    - Simpan ke tabel `summaries` (Upsert per `workspace_id`).
    - **History Upsert:** Insert log di `activity_logs` dengan `target_url: /workspaces/[id]?tab=summary`.
  - 🔄 **State:** Auto-load summary jika sudah pernah di-generate, state loading skeleton saat AI merangkum.
  - 🧪 **Testing:** Generate summary, refresh page (data tetap ada), klik "Save to Notes" tersimpan di `notes` table.

---

### 📌 TASK 2: Workspace Detail — Tab Flashcards (AI Flashcard Generator)
- [x] **[AGENT] Fitur AI Flashcards & Flip Card Viewer**
  - 🎨 **Design:** UI Tab `FLASHCARD` di Workspace Detail. Flashcard Viewer interaktif (Flip animation depan/belakang, Progress indicator "Card 3 of 10", Next/Prev control, Shuffle mode).
  - ⚡ **API & DB:** 
    - API Route `/api/generate/flashcards` (Gemini API Structured JSON Array `[{ front, back }]`).
    - Simpan ke tabel `flashcards` (Upsert per `workspace_id`).
    - **History Upsert:** Insert/Update log di `activity_logs` dengan `target_url: /workspaces/[id]?tab=flashcard`.
  - 🔄 **State:** Card flip state (IsFlipped), active card index state, state loading skeleton generator.
  - 🧪 **Testing:** Generate 10 flashcards, bolak-balik kartu, refresh & buka via link `/history?tab=flashcard`.

---

### 📌 TASK 3: Workspace Detail — Tab Quiz & Attempt History
- [x] **[AGENT] Fitur Interactive Quiz & Attempt Logs**
  - 🎨 **Design:** 
    - UI Tab `QUIZ` di Workspace Detail. 
    - **Quiz Runner:** Tampilan soal pilihan ganda (Radio options, instant feedback penjelasan jawaban benar/salah, submit quiz).
    - **Quiz Result Modal/View:** Tampilan skor akhir (misal: "80/100 - Bagus Sekali!"), review jawaban.
    - **Attempt List:** Daftar riwayat attempt di dalam tab Quiz ("Attempt #1 - 80%", "Attempt #2 - 100%").
  - ⚡ **API & DB:** 
    - API Route `/api/generate/quiz` (Gemini API Structured JSON).
    - Simpan kuis ke `quizzes` table.
    - **Attempt-Based History (Khusus Quiz):** Setiap kali kuis diselesaikan, buat entry log BARU di `activity_logs` dengan `target_url: /workspaces/[id]?tab=quiz&attempt_id=[ATTEMPT_ID]` agar user bisa melihat skor attempt spesifik dari `/history`.
  - 🔄 **State:** Selected answer per question, submission state, score calculation, state viewer attempt lama.
  - 🧪 **Testing:** Kerjakan kuis 2x, pastikan di `/history` muncul 2 attempt terpisah yang masing-masing menunjukkan hasil/skornya saat diklik.

---

### 📌 TASK 4: Synchronized Activity Logs & Link Routing (`/history`)
- [ ] **[AGENT] Centralized History Page dengan Deep Linking**
  - 🎨 **Design:** Halaman `/history` dengan UI Vertical Timeline & Direct Tab Links.
  - ⚡ **API & DB:** Query data dari `activity_logs` (Workspace, Chat, Summary, Flashcard, Quiz Attempt, Notes).
  - 🔄 **State:** URL Tab Switcher (saat user buka `/workspaces/[id]?tab=flashcard`, tab langsung aktif ke `flashcard`).
  - 🧪 **Testing:** Klik link dari item History (Summary, Flashcard, Quiz Attempt), verifikasi halaman terbuka langsung di Tab & data yang sesuai.

---

### 📌 TASK 5: Global Assistant (`/assistant`) & Persistent DB Chat
- [ ] **[AGENT] Global AI Chat & Database Persistence**
  - 🎨 **Design:** Layout full-screen chat di `/assistant` dengan sidebar sesi percakapan global (`workspace_id IS NULL`).
  - ⚡ **API & DB:** Simpan pesan chat ke Supabase tabel `chats` dan `messages`.
  - 🔄 **State:** Switch antar sesi percakapan, new chat session, streaming response via `useChat`.
  - 🧪 **Testing:** Chat di Global Assistant dan Workspace Chat, verifikasi riwayat tersimpan permanen di Supabase DB.

---

### 📌 TASK 6: Halaman Notes / Catatan Personal (`/notes`)
- [ ] **[AGENT] Sistem Catatan & Rich Text Editor**
  - 🎨 **Design:** UI `/notes` (Sidebar daftar catatan + Rich Text/Markdown Editor).
  - ⚡ **API & DB:** CRUD `notes` + Insert log ke `activity_logs` (`action: "CREATE_NOTE"`).
  - 🔄 **State:** Auto-save draft (debounce 1000ms), search & filter notes.
  - 🧪 **Testing:** Buat & edit catatan, pastikan link di `/history` mengarahkan ke note tersebut.

---

### 📌 TASK 7: Admin Dashboard & System Management (`/admin`)
- [ ] **[AGENT] Panel Admin, User Management & Broadcast**
  - 🎨 **Design:** Dashboard Metrics, Data Table Users, Broadcast Notification Form.
  - ⚡ **API & DB:** Service Role Bypass RLS (`lib/supabase/admin.ts`), Guard Middleware Admin, Notification Blast.
  - 🔄 **State:** Realtime Notification Bell counter di akun User.
  - 🧪 **Testing:** Admin blast notifikasi -> Bell ikon di akun User menyala.

---

## 🔵 Fase Akhir: Testing, Polish & Deployment

- [ ] **[AGENT] Polish, Performance & Type Safety Check**
  - Run `npm run build` dan `npx tsc --noEmit` untuk 0 TypeScript error.
- [ ] **[USER / AGENT] Production Deployment (Vercel)**
  - Push ke GitHub, setup Env Vars di Vercel, verifikasi OAuth & API Gemini.
