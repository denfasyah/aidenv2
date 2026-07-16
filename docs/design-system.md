# Design System & UI/UX Guidelines - Aiden v2

Dokumen ini mendefinisikan aturan gaya, warna, dan komponen visual untuk aplikasi Aiden v2. Tujuannya adalah menciptakan antarmuka yang *clean*, modern, dan nyaman untuk belajar (tidak terlalu terkesan "berat" seperti aplikasi AI murni).

## 1. Pendekatan Styling (Tailwind CSS + CSS Variables)
Kita akan menggunakan **Tailwind CSS**. Untuk mendukung *Dark Mode* dan *Light Mode* dengan mulus, kita akan menggunakan *CSS Variables* di dalam file `globals.css`. 

Plugin tambahan:
- `next-themes` (Untuk toggle Dark/Light mode)
- `clsx` dan `tailwind-merge` (Untuk menggabungkan class secara dinamis di komponen UI)
- `lucide-react` (Untuk icon modern yang minimalis)

## 2. Palet Warna (Color Palette)
Warna utama (Primary) adalah **Hijau** (menggambarkan pertumbuhan dan pembelajaran).

### `globals.css` (Konsep)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%; /* Putih */
    --foreground: 222.2 84% 4.9%; /* Teks gelap */

    /* Primary Green (Modern/Emerald) */
    --primary: 142.1 76.2% 36.3%; 
    --primary-foreground: 355.7 100% 97.3%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 142.1 76.2% 36.3%; /* Ring hijau saat fokus */
    --radius: 0.75rem; /* Sudut melengkung modern */
  }

  .dark {
    --background: 222.2 84% 4.9%; /* Latar gelap/hitam keabuan */
    --foreground: 210 40% 98%;

    --primary: 142.1 70% 45%;
    --primary-foreground: 144.9 80.4% 10%;

    --card: 222.2 84% 8%;
    --card-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
  }
}
```

## 3. Tipografi
- Gunakan font modern tanpa serif (sans-serif), seperti **Inter** atau **Geist** (Bawaan Next.js).
- Hirarki yang jelas: `h1` untuk judul halaman utama, teks paragraf menggunakan warna *muted* agar tidak terlalu kontras di mata.

## 4. Panduan Desain Halaman Utama

### A. Auth Page (Login / Register)
- **Desain:** Modern card UI di tengah layar (terpusat).
- **Elemen:** 
  - Logo/Nama aplikasi (Aiden).
  - Teks sapaan yang ramah ("Selamat datang kembali!").
  - Form email & password dengan animasi *focus ring* berwarna hijau.
  - **Tombol "Continue with Google":** Desain tombol putih/abu dengan ikon Google asli, terpisah dengan *divider* ("OR").

### B. Dashboard & Layout
- **Sidebar:** *Collapsible* (bisa dilipat). Berisi navigasi ke Workspace, History, dan tombol Toggle Tema (Matahari / Bulan).
- **Header/Top Bar:** Menampilkan nama pengguna, *breadcrumbs* (posisi halaman), dan avatar profil.
- **Card Statistik:** Desain kartu (card) dengan *border* tipis, *shadow* sangat halus (soft shadow), dan sudut melengkung (rounded).

### C. Pembelajaran (Workspace & Generates)
- Desain harus sangat *clean* dengan banyak *white space* agar mata tidak lelah saat membaca Ringkasan atau Quiz.
- Warna *background* untuk area baca sedikit dibedakan dengan *background* utama (misal menggunakan `--muted` color).

## 5. Standar Komponen (di `components/ui/`)
- Semua komponen dasar (Button, Input, Card, Modal) harus dibuat fleksibel dan dapat digunakan kembali (*reusable*).
- Komponen Button akan memiliki varian: `default` (Hijau), `outline` (Garis tepi), `ghost` (Tanpa background), dan `link`.
