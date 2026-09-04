# KoZa — Development Log

## 1. Identitas Produk

- **Nama resmi:** KoZa
- **Filosofi nama:** KOntrol SAKU / KOcek TerjAga
- **Tagline:** "Mencatat Rapi, Kocek Terjaga"
- **Tanggal peresmian:** Jumat, 4 September 2026

## 2. Tech Stack & Arsitektur

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS v3 — sengaja didowngrade dari v4 bawaan `create-next-app` agar kompatibel 1:1 dengan format `tailwind.config` (JS, bukan CSS `@theme`) yang diekspor langsung oleh Google Stitch, sehingga seluruh token warna/spacing/typography bisa diporting apa adanya tanpa reinterpretasi.
- **Ikon:** Material Symbols Outlined (Google Fonts), dimuat via `<link>` di `layout.tsx` — bukan library ikon React (mis. lucide-react), mengikuti persis cara Stitch mengekspor ikonnya.
- **State management:** React Context + `useReducer` (`FinanceContext`, di `src/lib/finance-context.tsx`) sebagai satu-satunya sumber data dompet & transaksi, dikonsumsi lintas layar lewat hook `useFinance()`. **Tanpa library state eksternal** (tidak ada Redux, Zustand, Jotai, dll) — cukup dilayani primitif React karena skala aplikasi belum membutuhkan lebih.
- **Tema:** `next-themes` (`attribute="class"`, `enableSystem`) — light/dark mengikuti preferensi sistem perangkat, tanpa toggle manual yang tidak ada di desain Stitch.
- **Font:** Plus Jakarta Sans, dimuat via Google Fonts `<link>` (bukan `next/font`) agar rendering identik dengan preview Stitch.

## 3. Status Layar

| Layar | Status |
|---|---|
| Beranda | ✅ Selesai |
| Catat Transaksi | ✅ Selesai |
| Riwayat Transaksi | ✅ Selesai |
| Laporan Keuangan | ✅ Selesai |
| Profil & Pengaturan | ✅ Selesai |

## 4. Keputusan & Prinsip Teknis

- **Kalkulasi matematis riil, bukan teks statis.** Semua angka yang tampil (saldo total, kas masuk/keluar bulanan, net harian di Riwayat) dihitung langsung dari dataset transaksi lewat fungsi murni di `finance.ts` (`getTotalBalance`, `getMonthlySummary`, `groupTransactionsByDay`) — tidak ada angka yang disalin mentah dari copy placeholder Stitch.
- **Konsistensi warna kategori lintas layar.** Warna ikon kategori di-resolve dari satu katalog tunggal (`CATEGORY_OPTIONS` di `categories.ts`), bukan meniru warna contoh spesifik di tiap screen Stitch — karena ditemukan bahwa Beranda, Catat Transaksi, dan Riwayat masing-masing punya skema warna kategori yang saling tidak konsisten satu sama lain (wajar untuk mockup yang digenerate independen per layar). Satu transaksi yang sama akan selalu tampil dengan warna kategori yang sama di manapun ia dirender.
- **Pemisahan fungsi murni dari komponen UI.** Logika finansial (`finance.ts`) dan formatter (`format.ts`) berdiri sendiri, reusable dan mudah diuji, terpisah dari komponen presentasi (`page.tsx`, komponen di `components/`).
- **Guardrail fidelitas visual 100%.** Markup dan kelas Tailwind setiap layar diporting persis dari HTML mentah yang diunduh langsung dari Stitch (bukan hasil interpretasi ulang) — tidak ada penambahan, pengubahan, atau "mempercantik" elemen visual di luar yang benar-benar ada di desain sumber. Interaktivitas (state, validasi, navigasi, koneksi data) dibangun di atas markup tersebut tanpa mengubah satu pun kelas/warna/spacing yang sudah ditetapkan Stitch.
- **Repo hygiene.** Kredensial (API key Stitch di `.codex/config.toml`, ditemukan saat commit pertama) dikecualikan lewat `.gitignore`, tidak pernah masuk git history.

## 5. Arsitektur Visualisasi — Layar Laporan

- **Pendekatan:** SVG murni untuk donut chart + Tailwind utility (div dengan `height`/`width` inline persentase) untuk bar chart — **tanpa library charting** (bukan Recharts/Chart.js/dsb). Dipilih karena kedua chart ini sudah didesain lengkap oleh Stitch sebagai markup statis (lingkaran `stroke-dasharray`/`stroke-dashoffset` untuk donut, div bertumpuk dengan `height: X%` untuk bar) — menambah library eksternal hanya untuk mereplikasi bentuk yang sudah ada di markup adalah pemborosan dependency, bukan efisiensi.
- **Satu pipeline agregasi untuk semua granularitas.** `src/lib/report.ts` mengekspor `getPeriodReport(transactions, granularity, anchorDate)` yang menghasilkan satu bentuk data (`PeriodReport`) dipakai oleh SEMUA elemen visual (kartu ringkasan, donut, bar chart, ranked list) sekaligus — bukan 4 fungsi terpisah per chart. Granularitas (Harian/Mingguan/Bulanan/Tahunan) dan navigasi periode (chevron kiri/kanan) hanya mengubah *rentang tanggal* yang di-agregasi; bentuk visual (shape) yang dirender tetap 100% markup Stitch yang sama.
- **Warna donut & progress bar** memakai token desain yang sudah ada (`primary-container`/`secondary-container`/`tertiary-container`/`outline-variant`) via kelas Tailwind `text-*` + `stroke="currentColor"` pada SVG — bukan hex hardcode — sehingga otomatis konsisten antara mode terang/gelap tanpa kode tambahan.
- **Keputusan penting — export dark mode Laporan dari Stitch tidak diikuti.** Ditemukan bahwa file dark-mode Laporan yang diekspor Stitch memakai palet warna berbeda sendiri (`bg-slate-800`, `text-white`, `bg-emerald-500`, `bg-sky-400`, `bg-rose-400`, `bg-purple-400`) — bukan sistem token standar (`on-surface`, `surface-container-lowest`, dst.) yang dipakai konsisten oleh Beranda, Catat Transaksi, dan Riwayat di mode gelap. Mengikuti export tersebut secara literal akan membuat layar Laporan terlihat "beda aplikasi" saat toggle dark mode dibanding layar lain. Diputuskan untuk membangun Laporan dengan sistem token standar yang sama (otomatis theme-aware lewat CSS variable yang sudah ada), bukan meniru palet dark yang menyimpang tersebut — demi konsistensi produk secara keseluruhan.
- **Adaptasi konten (bukan visual) yang jujur secara data:** dua label di kartu ringkasan diganti isinya (bukan gaya/posisinya) karena versi asli Stitch butuh data yang belum ada di aplikasi ini:
  - "45% dari target" (butuh sistem anggaran/budget per kategori yang belum dibangun) → diganti pola yang sama dengan kartu Pemasukan: "±X% dari [periode sebelumnya]", dihitung riil.
  - "Sesuai Anggaran" di tengah donut (klaim yang tak bisa diverifikasi tanpa budget) → diganti jumlah transaksi riil periode tsb, warna & posisi tetap sama.

## 6. Arsitektur Layar Profil & Pengaturan

- **Header judul diperbaiki, bukan diporting apa adanya.** File export ringan (`profil_light.html`) memuat bug copy-paste: `<h1>` di header fixed bertuliskan "Beranda" (bocoran dari template Beranda), sementara `profil_dark.html` dan heading `<h2>` di badan kedua file sudah benar "Profil & Pengaturan". Mengikuti pola yang sudah dipakai konsisten di Beranda/Transaksi/Laporan (h1 header = label singkat sesuai BottomNav, h2 di badan = judul lengkap section), header di-set ke "Profil" — bukan mengikuti tipo Stitch secara literal.
- **Dark mode: token standar dipakai lagi, ekspor dark Stitch dilewati.** Sama seperti Laporan (lihat §5), `profil_dark.html` memakai palet hex literal sendiri (`bg-[#0a0e17]`, `text-white`, `bg-[#10b981]`, dst.) alih-alih token `on-surface`/`surface-container-lowest` dkk. yang dipakai konsisten di seluruh app. Markup yang diporting ke JSX adalah versi **light** dengan kelas token Tailwind standar (`bg-surface-container-lowest`, `text-on-surface`, dst.) sehingga otomatis theme-aware lewat CSS variable yang sudah ada — tanpa kode dark-mode tambahan, tanpa deviasi palet dari layar lain.
- **Dompet terhubung — data riil, bukan angka Stitch.** Kartu "Dompet: X Terhubung" dihitung dari `wallets.length` (`useFinance()`), bukan angka placeholder "3 Terhubung" di desain Stitch. Karena `mock-data.ts` sudah punya 4 dompet (BCA, Kas Tunai, GoPay, OVO), layar kini menampilkan "4 Terhubung" — sengaja dibiarkan berbeda dari mockup demi konsistensi dengan prinsip "kalkulasi matematis riil" (§4.1) dan demi memenuhi permintaan eksplisit untuk menghubungkan daftar dompet ke `FinanceContext`.
- **Profil pengguna: `UserProfile` diperluas, bukan didupliksi.** Field baru `fullName` ("Budi Santoso", untuk kartu profil & inisial avatar "BS") dan `memberSince` (ISO date, diformat via `formatMonthYearId` → "Jan 2026") ditambahkan ke `currentUser` di `mock-data.ts`. Field `name` ("Budi", dipakai untuk sapaan singkat di Beranda) sengaja tidak diubah/ditimpa agar screen Beranda yang sudah selesai tidak terpengaruh — satu sumber data (`currentUser`), dua representasi nama untuk dua konteks tampilan berbeda.
- **Skor Finansial: label kategori dihitung, bukan hardcode teks "Sehat".** `getHealthScoreLabel(score)` di `finance.ts` menerjemahkan `currentUser.healthScore` (88, sumber sama dengan Skor Kesehatan di Beranda) menjadi label kategori (≥80 "Sehat", 60-79 "Cukup Sehat", <60 "Perlu Perhatian") — sehingga teks "Sehat" konsisten secara matematis dengan angka yang ditampilkan di sebelahnya, bukan string statis yang bisa berbeda dari angka aktual.
- **Elemen dekoratif tanpa model data dibiarkan statis (tanpa over-engineering).** Badge tier "Personal Free", badge "Baru" di Ekspor Laporan, serta link "Daftar Dompet Manual" / "Kategori Transaksi" / "Ekspor Laporan" / "Keamanan & PIN" / "Bantuan & Dukungan" tetap sebagai markup statis (`href="#"`) — konsisten dengan pola yang sudah ada di Beranda (tombol Top Up/Transfer/Kantong juga dekoratif tanpa handler) karena layar tujuannya belum dibangun dan tidak diminta di sesi ini. Toggle "Pengingat Harian" memakai `useState` lokal (bukan `FinanceContext`) karena preferensi ini murni UI, tidak memengaruhi data keuangan.
- **`ComingSoonScreen` dihapus.** Komponen placeholder itu hanya dipakai oleh Profil (satu-satunya layar yang belum selesai); setelah Profil selesai, komponen tersebut sudah tidak dipakai di mana pun sehingga dihapus alih-alih dibiarkan jadi dead code.
- **Milestone lengkap.** Dengan selesainya Profil & Pengaturan, kelima layar MVP KoZa (Beranda, Catat Transaksi, Riwayat, Laporan, Profil) sudah dibangun dengan fidelitas visual 100% dari Stitch dan terhubung ke satu sumber data (`FinanceContext`).
