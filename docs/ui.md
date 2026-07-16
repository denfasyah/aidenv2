# Panduan Antarmuka Pengguna (UI Wireframe) - Aiden v2

Dokumen ini merinci struktur navigasi dan pembagian tata letak aplikasi untuk memastikan pengalaman pengguna (UX) yang rapi.

## 1. Landing Page (Halaman Utama)
- **Navbar:** Logo Aiden, Link ke fitur, Tombol Login & Register.
- **Hero Section:** Slogan (*Tagline*), Penjelasan Singkat, Tombol "Mulai Belajar Sekarang".
- **Features Section:** Poin-poin penjelasan mengenai AI Assistant, Flashcard, dan Workspace.

## 2. Dashboard User (Pengguna Biasa)

### A. Sidebar Navigasi (User)
*(Berada di kiri, warna latar solid/senada tema)*
- 🏠 **Dashboard** (Ringkasan statistik)
- 📚 **Workspaces** (Daftar ruang materi)
- 🤖 **Assistant** (Halaman Chat AI terpusat)
- 📝 **Notes** (Pusat catatan manual)
- ⏳ **History** (Daftar riwayat aktivitas terbaru)

### B. Navbar Atas (User & Admin)
*(Berada di atas, memanjang dari kanan ke ujung batas sidebar)*
- 🔔 **Notifikasi (Icon Lonceng):** Klik untuk memunculkan *dropdown* berisi pemberitahuan dari Admin.
- 👤 **Profil (Avatar + Nama):** Klik untuk *dropdown* (Settings, Billing, Logout).
- 🌓 **Theme Toggle:** Tombol ganti Mode Gelap/Terang.

### C. Isi Konten Dashboard (`/dashboard`)
- **Statistik Cepat (Cards):** Total Workspaces | Total Flashcards | Total Catatan | Kuiz Dikerjakan.
- **Akses Cepat (Quick Actions):** Tombol "Tanya Assistant", "Buat Workspace Baru".
- **Aktivitas Hari Ini:** Tampilan sekilas (mini-feed) dari `activity_logs`.

---

## 3. Admin Panel (Panel Kendali)

### A. Sidebar Navigasi (Admin)
- 📊 **Dashboard** (Ringkasan platform)
- 👥 **Manage Users** (Daftar semua pengguna terdaftar)
- 📢 **Broadcast** (Kirim pengumuman ke Lonceng Notif pengguna)
- ⚙️ **System Config** (Pengaturan sistem, kesehatan API Gemini)

### B. Isi Konten Admin Dashboard (`/admin/dashboard`)
- **Global Stats:** Total Users Aktif, Total Interaksi AI (Token/Generations).
- **Recent Registrations:** Tabel 5 pendaftar terakhir.
- **Live Platform Feed:** Memantau aktivitas *(tanpa melihat isi rahasia)*, misal: "User A men-generate 10 Flashcards".

### C. Halaman Manage Users (`/admin/users`)
- Tabel penuh berisi seluruh data `users`.
- Kolom: Nama | Email | Role | Tgl Bergabung | Aksi (Ubah Role / Suspend).
