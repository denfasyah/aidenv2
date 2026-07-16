# Product Requirements Document (PRD) - Aiden v2 (Full Blueprint)

## 1. Ringkasan Eksekutif
Aiden v2 adalah penyempurnaan menyeluruh dari platform asisten pembelajaran AI. Sistem ini mengintegrasikan pengarsipan aktivitas (History), Catatan Pribadi (Notes), Notifikasi sistem, dan pemisahan Hak Akses (Role-Based Access Control) antara Pengguna Biasa dan Admin. 

## 2. Fitur Utama & Kriteria Penerimaan (Acceptance Criteria)

### A. Autentikasi & Hak Akses (RBAC)
- Login/Register via Email & Password atau Google OAuth.
- **Role User:** Akses ke ruang kerja pribadi.
- **Role Admin:** Akses ke metrik platform dan manajemen *user*.

### B. Admin Dashboard (Panel Kendali Utama)
Panel yang terisolasi dari *User* biasa. Fitur:
- **Global Overview:** Statistik total seluruh pengguna, jumlah total *flashcard/quiz/summary* yang pernah dibuat, dan grafik pertumbuhan.
- **User Management:** Daftar semua pengguna terdaftar. Admin dapat memantau aktivitas terakhir pengguna.
- **Notification Center (Admin):** Fasilitas bagi Admin untuk membuat *System Notification* yang akan dikirim (di-blast) ke semua user.
- **System Logs:** Tabel aktivitas krusial sistem.

### C. User Dashboard (Ruang Personal)
- **Welcome & Stats:** Menampilkan jumlah *workspace* dan konten yang telah dibuat.
- **Recent Activity (Centralized History):** Sistem *timeline* yang merekam aktivitas user (misal: "Membuat Flashcard X pada jam Y", "Login pada jam Z"). Data diambil dari tabel `activity_logs`.
- **Notifications Bell:** Ikon lonceng yang menampilkan notifikasi dari Admin atau sistem.

### D. Workspace Management & AI Generations
- Setiap pengguna dapat membuat banyak *Workspace*.
- Di dalam Workspace, terdapat fitur:
  - **AI Generations:** Membuat Flashcards, Quizzes, Summaries. Semua tersimpan utuh di tabel spesifik.
  - **Notes (Catatan):** Ruang teks (Rich text/Markdown) bagi pengguna untuk mencatat rangkuman pribadi mereka secara manual.
  - **Workspace AI Chat:** Asisten chat spesifik untuk materi di *Workspace* tersebut.

### E. AI Chat Terisolasi
- **Global Chat:** Chat di luar *workspace* (`workspace_id IS NULL`).
- **Workspace Chat:** Chat di dalam *workspace* (`workspace_id = [ID]`).

## 3. Skema Data (Rangkuman)
Aplikasi didukung oleh 10 tabel utama di Supabase: `profiles`, `workspaces`, `flashcards`, `quizzes`, `summaries`, `notes`, `chats`, `messages`, `notifications`, dan `activity_logs`.
