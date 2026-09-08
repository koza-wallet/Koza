# Brainstorming Teknis Koza: Sudut Pandang Engineer

Berikut adalah poin-poin utama dari kacamata teknis yang bisa diolah untuk materi *copywriting* penjualan Koza:

## 1. The Core Hook (Fitur Paling "Jual")
*   **Offline-First & PWA Ready:** Aplikasi tidak butuh internet untuk berfungsi (kecuali sinkronisasi awal). Seluruh data transaksi dan saldo tersimpan aman di perangkat *user* (`localStorage`). Pengalaman secepat dan seandal aplikasi native.
*   **Kalkulasi Matematis Seketika:** Tidak ada *loading spinner* ketika mencatat keuangan. Data saldo antar dompet, pengeluaran harian, dan laporan terbarui instan secara reaktif.
*   **Fidelitas Visual Premium:** Desain UI/UX 100% *pixel-perfect* yang mendukung *Dark/Light mode* otomatis (bebas kedipan/FOUC), memberikan kesan elegan dan profesional tingkat tinggi.

## 2. The Pain Reliever (Masalah Utama yang Dibereskan Arsitektur)
*   **Bebas Bug "Saldo Bocor/Selisih":** Arsitektur *state management* (*two-step reversal* di `finance-context`) menggaransi bahwa setiap kali *user* mengubah, menghapus, atau memindahkan transaksi antar dompet, saldo akhir pasti akurat 100%. Tidak ada uang yang "hilang dari catatan".
*   **Penyakit "Hydration Mismatch" Disembuhkan:** Aplikasi Next.js sering *crash* sesaat (berkedip) saat data lokal tidak sinkron dengan server. Koza merancang alur *render* cerdas (via `useRef` bypass) yang memasikan aplikasi mulus sempurna saat pertama kali dibuka.
*   **Input Pintar Anti-Error:** *User* bebas dari salah ketik angka. Form otomatis membersihkan input (anti angka negatif, desimal, dan input non-angka), lengkap dengan validasi proteksi saldo minus.

## 3. The Hidden Benefit (Kekuatan "Under-the-Hood")
*   **Mesin Visualisasi Laporan "Sangat Ringan":** *Donut chart* dan *bar chart* dibangun murni dengan SVG + Tailwind, tanpa bergantung sama sekali pada library grafik raksasa (seperti Recharts atau Chart.js). Hasilnya adalah *rendering* instan tanpa membebani memori HP pengguna.
*   **Logika Bisnis Independen (Pure Functions):** Otak penghitung uang Koza benar-benar dipisahkan dari desain visual antarmukanya. Kode ini sangat tangguh, bebas dari efek samping visual, dan bisa didaur-ulang penuh jika Koza berekspansi ke platform lain.
*   **Sistem Token Tema Cerdas:** Warna UI tidak di-*hardcode*. Melainkan menggunakan sistem "token" cerdas. Jika Koza ganti logo dan warna *brand* suatu hari nanti, prosesnya hanya butuh hitungan menit.

## 4. Data/Angka Pendukung (Metrik Performa)
*   **0 Error & 0 Warning (Enterprise-Grade):** Lolos kompilasi TypeScript ketat dan audit ESLint 100% bersih. Aplikasi ini stabil sejak di ranah penulisan kode.
*   **100% Uji Otomatis Lulus (9/9 Test Pass):** Seluruh fungsi logika matematika telah dibuktikan akurat oleh mesin penguji otomatis (Vitest). Jaminan tak ada rumus hitungan yang melenceng.
*   **No Bloatware (Arsitektur Ekstra Ramping):** Sengaja dibangun **tanpa** Redux (hanya React Context native) dan tanpa library kosmetik tak berguna, membuat konsumsi daya dan baterai HP *user* saat menggunakan aplikasi tetap irit.
