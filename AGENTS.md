<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PROTOKOL KEAMANAN & OPERASIONAL AGEN (WAJIB DIPATUHI)

### 1. Izin & Persetujuan Tindakan
* **Wajib Paparkan Rencana:** Sebelum membuat, mengedit, atau menghapus file apa pun, selalu jelaskan rencana pengerjaan secara bertahap (*step-by-step plan*).
* **Tunggu Konfirmasi Pengguna:** Dilarang memodifikasi file atau menjalankan perintah sebelum mendapat konfirmasi "Ya/Lanjutkan" dari saya.
* **Tidak Ada Perintah Mandiri:** Jangan jalankan perintah terminal berbahaya (`rm`, `mv`, modifikasi global, eksekusi skrip jaringan) tanpa izin eksplisit.

### 2. Batasan Akses File & Lingkungan
* **Terkunci di Workspace:** Hanya akses dan modifikasi file di dalam direktori proyek `Koza`.
* **Proteksi File Rahasia:** Dilarang membuka, membaca isi, mencetak, atau memodifikasi file `.env`, `.env.local`, file kredensial, maupun kunci API.
* **Pemeriksaan Kompatibilitas:** Ikuti dokumentasi internal Next.js pada `node_modules/next/dist/docs/` sebelum menulis kode baru.

### 3. Bahasa & Komunikasi
* Gunakan **Bahasa Indonesia** untuk seluruh penjelasan masalah, pemaparan solusi, dan ringkasan perubahan.
* Nama variabel, fungsi, nama file, dan komentar kode teknis tetap menggunakan istilah baku industri.
