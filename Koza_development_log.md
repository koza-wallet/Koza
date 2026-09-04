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
| Laporan Keuangan | 🔜 Tahap berikutnya |
| Profil & Pengaturan | ⏳ Pending |

## 4. Keputusan & Prinsip Teknis

- **Kalkulasi matematis riil, bukan teks statis.** Semua angka yang tampil (saldo total, kas masuk/keluar bulanan, net harian di Riwayat) dihitung langsung dari dataset transaksi lewat fungsi murni di `finance.ts` (`getTotalBalance`, `getMonthlySummary`, `groupTransactionsByDay`) — tidak ada angka yang disalin mentah dari copy placeholder Stitch.
- **Konsistensi warna kategori lintas layar.** Warna ikon kategori di-resolve dari satu katalog tunggal (`CATEGORY_OPTIONS` di `categories.ts`), bukan meniru warna contoh spesifik di tiap screen Stitch — karena ditemukan bahwa Beranda, Catat Transaksi, dan Riwayat masing-masing punya skema warna kategori yang saling tidak konsisten satu sama lain (wajar untuk mockup yang digenerate independen per layar). Satu transaksi yang sama akan selalu tampil dengan warna kategori yang sama di manapun ia dirender.
- **Pemisahan fungsi murni dari komponen UI.** Logika finansial (`finance.ts`) dan formatter (`format.ts`) berdiri sendiri, reusable dan mudah diuji, terpisah dari komponen presentasi (`page.tsx`, komponen di `components/`).
- **Guardrail fidelitas visual 100%.** Markup dan kelas Tailwind setiap layar diporting persis dari HTML mentah yang diunduh langsung dari Stitch (bukan hasil interpretasi ulang) — tidak ada penambahan, pengubahan, atau "mempercantik" elemen visual di luar yang benar-benar ada di desain sumber. Interaktivitas (state, validasi, navigasi, koneksi data) dibangun di atas markup tersebut tanpa mengubah satu pun kelas/warna/spacing yang sudah ditetapkan Stitch.
