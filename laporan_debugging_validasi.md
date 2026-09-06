# Laporan Debugging & Validasi: Koza

Dokumen ini berisi pencatatan investigasi (*roleplay debugging*) pada alur kerja aplikasi secara menyeluruh, sesuai dengan permintaan.

## 1. Analisis Fitur "Ubah Sandi" (Reset Password)
**Skenario A:** Pengguna (yang sudah login di menu Pengaturan) ingin mengubah sandi.
*   **Temuan Bug:** Pengguna diblokir dengan pesan "Akses Ditolak: Token tidak valid".
*   **Akar Masalah:** Halaman `/auth/reset-password` memaksa adanya parameter URL `?token=...`, yang mana itu adalah sisa-sisa implementasi NextAuth manual. Supabase menggunakan sesi pengguna aktif untuk mengganti sandi, bukan parameter `token`.
*   **Status Perbaikan:** [SEDANG DIPERBAIKI] Menghapus pengecekan token.

**Skenario B:** Pengguna lupa sandi dan meminta tautan via email.
*   **Temuan Bug:** Tautan email rusak dan gagal membuat pengguna login untuk mengganti sandi.
*   **Akar Masalah:** Fungsi `forgotPasswordAction` mengatur `redirectTo` langsung ke halaman `/auth/reset-password`. Supabase Auth (dengan PKCE) akan mengirim `?code=...` ke URL tersebut, padahal Next.js kita hanya menukar kode itu menjadi sesi di `/auth/callback`. Jadi pengguna tidak akan pernah masuk (*login*) dan server tidak akan memiliki kuki sesi untuk mengubah sandi.
*   **Status Perbaikan:** [SEDANG DIPERBAIKI] Mengubah URL `redirectTo` menjadi `${APP_URL}/auth/callback?next=/auth/reset-password`.

## 2. Navigasi Notifikasi (Gambar Lonceng)
**Skenario:** Pengguna mengklik ikon lonceng di berbagai halaman (Beranda, Transaksi, Laporan, Profil).
*   **Temuan Bug:** Tidak ada reaksi apa pun saat ikon diklik (mati).
*   **Akar Masalah:** Tombol lonceng hanya berupa elemen `<button>` HTML statis tanpa *event listener* `onClick`.
*   **Status Perbaikan:** [SEDANG DIPERBAIKI] Menambahkan _toast/alert_ bertuliskan "Belum ada notifikasi baru" pada seluruh tombol lonceng di semua halaman.

## 3. Peringatan Supabase: "RLS Disabled in Public"
**Skenario:** Pengguna melihat *Advisor Warning* di Dasbor Supabase.
*   **Analisis Keamanan:** Aplikasi kita menggunakan `Prisma Client` di sisi *Server* (Next.js Server Actions & API Routes). Prisma melakukan koneksi langsung ke *database* menggunakan `DATABASE_URL` (dengan *connection pooler*), yang berjalan dengan hak akses penuh (*postgres role*).
*   **Kesimpulan:** Peringatan RLS (*Row Level Security*) dari Supabase tersebut **AMAN UNTUK DIABAIKAN**. RLS hanya relevan dan wajib dinyalakan jika aplikasi *Frontend* (React/Browser) melakukan *fetch* data langsung ke API Supabase (*Data API/PostgREST*). Karena kita menggunakan Prisma di *Backend*, kita mengamankan datanya melalui logika aplikasi (seperti validasi `getSessionUser()`).

---
*Laporan ini akan terus diperbarui jika ditemukan temuan lanjutan.*
