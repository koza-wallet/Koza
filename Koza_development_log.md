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

## 7. Bug Fix — Kontras Teks Kartu "Total Saldo" (Beranda)

- **Gejala:** di mode gelap, nominal saldo dan label tombol Top Up/Transfer/Kantong pada kartu hero Beranda nyaris tak terbaca (hijau gelap di atas hijau gelap).
- **Akar masalah:** kartu memakai background gradient hex hardcode (`from-[#005236] via-[#006c49] to-[#003823]`) yang **tidak** ikut berubah antar tema, tapi teks di dalamnya memakai token `text-on-primary` yang **memang dirancang berubah** — di mode gelap `--on-primary` bernilai `#003824` (hijau tua, pasangan kontras untuk `bg-primary` yang di mode gelap jadi hijau terang `#34d399`). Karena `bg-primary` kartu ini tidak dipakai (background-nya fixed hex), pasangan token itu jadi tidak relevan dan menghasilkan teks gelap di atas background gelap.
- **Perbaikan:** semua turunan `text-on-primary` di dalam kartu ini (container, ikon toggle mata, label "Top Up"/"Transfer"/"Kantong") diganti ke `text-white` (solid, untuk nominal & ikon) dan `text-white/90` (label tombol) / `text-white/80` (subteks "Dompet Aktif & Simpanan") — warna tetap (theme-invariant) mengikuti sifat background kartu yang juga tetap. Dikonfirmasi lewat grep bahwa semua pemakaian `text-on-primary` lain di codebase (BottomNav, header avatar, chip filter, dsb.) sudah berpasangan benar dengan background theme-reactive (`bg-primary`/`bg-primary-container`) sehingga tidak disentuh — bug ini murni isolasi di satu kartu ini.
- **Verifikasi:** dicek visual di Chrome mode terang & gelap (screenshot), hanya kelas warna yang berubah — tidak ada kelas layout/spacing/ukuran yang disentuh — dan `npm run build` tetap sukses 100%.

## 8. Persistensi Lokal — Auto-Save `FinanceContext` ke `localStorage`

- **Mekanisme:** `FinanceProvider` (`src/lib/finance-context.tsx`) sekarang menyimpan snapshot `{ wallets, transactions }` ke `localStorage` di bawah key `koza.finance-state.v1` setiap kali state berubah (setelah `ADD_TRANSACTION`, atau aksi baru `RESET`), dan memuatnya kembali saat provider pertama kali mount. Tanpa backend, ini membuat data transaksi & saldo bertahan lintas reload/tutup-buka browser di perangkat yang sama.
- **Aman dari hydration mismatch.** `useReducer` selalu diinisialisasi dengan `defaultState` (dummy data yang sama persis dengan sebelumnya) — baik saat render di server maupun render pertama di client — sehingga HTML hasil SSR dan hasil hydration client selalu identik. Pembacaan `localStorage` (yang hanya ada di client) dipindah seluruhnya ke dalam `useEffect` (dijaga tambahan `typeof window !== "undefined"`), yang baru jalan setelah mount selesai; jika ada snapshot tersimpan, di-apply lewat aksi reducer baru `HYDRATE` — sehingga tidak pernah ada pembacaan `window`/`localStorage` di jalur render.
- **Race kondisi mount dihindari dengan `useRef`, bukan `useState`.** Percobaan pertama pakai flag `isHydrated` via `useState` kena error lint `react-hooks/set-state-in-effect` (memicu setState sinkron di dalam effect). Solusi akhir: `skipNextPersistRef` (```useRef(true)```) yang membuat effect penyimpan **melewati** penulisan pertamanya saat mount (saat state masih `defaultState`, sebelum effect pemuat sempat men-dispatch `HYDRATE`) — sehingga snapshot yang baru saja dimuat tidak keburu tertimpa data default. Sudah diuji manual: seed data palsu ke `localStorage` → reload → data palsu tetap utuh (tidak tertimpa default).
- **Ketahanan data korup/asing.** `isFinanceState()` melakukan pengecekan bentuk minimal (`wallets`/`transactions` harus array) sebelum data dari `localStorage` dipakai; jika JSON rusak, korup, atau storage tidak tersedia (mode privat/quota penuh), `try/catch` menjaga aplikasi tetap jalan dengan `defaultState` di memori tanpa crash.
- **Tombol "Reset ke Data Awal"** ditambahkan di Profil, di bawah "Keluar dari Akun" — elemen baru di luar export Stitch (fitur ini memang tidak ada di desain asli), memakai bahasa visual yang sudah ada (`bg-surface-container-low`, ikon `restart_alt`) agar tetap terasa satu sistem, dibedakan dari tombol destructive "Keluar" yang memakai token `error-container`. Aksinya memanggil `resetToDefault()` (dispatch `RESET` → balik ke `defaultState`, otomatis ikut tersimpan ke `localStorage` lewat effect yang sama) di belakang `window.confirm()` sebagai pengaman sederhana dari klik tidak sengaja.
- **Verifikasi end-to-end di Chrome:** (1) seed data palsu ke `localStorage` → reload → data palsu ter-load benar di UI & tidak tertimpa; (2) klik "Reset ke Data Awal" → `localStorage` langsung berisi data default (4 dompet, 13 transaksi) → reload lagi → tetap konsisten. `npx tsc --noEmit`, `eslint`, dan `npm run build` semua bersih/sukses.

## 9. Eksekusi Penuh Temuan Audit — CRUD Transaksi & Dompet, Kategori, Cleanup

Sesi ini mengeksekusi seluruh temuan audit dari sesi sebelumnya (Quick Wins + gap lifecycle data), dengan guardrail ketat: **tidak ada layout/token/tipografi Stitch yang diubah** — hanya fungsionalitas dan data yang disempurnakan. Storage key dinaikkan ke `koza.finance-state.v2` (skema `Transaction` berubah), sehingga snapshot v1 lama otomatis diabaikan dan kembali ke dataset default alih-alih dimuat parsial.

### 9.1 Model data diperluas untuk mendukung edit/hapus yang presisi

- `Transaction` (`types.ts`) mendapat 3 field baru: `categoryId` (wajib, sumber kebenaran untuk edit — sebelumnya cuma ada `category`/`categoryIcon` sebagai teks hasil resolusi, tidak bisa di-reverse ke id kategori asal), `walletId` (opsional — dompet sumber transaksi, dipakai untuk membalik saldo saat edit/hapus), dan `note` (opsional — catatan bebas terpisah dari `title`).
- **13 transaksi seed di `mock-data.ts` di-backfill** dengan `categoryId` + `walletId`. Untuk transaksi ber-metode "QRIS" (yang secara desain tidak berkorespondensi ke satu wallet manapun di `paymentMethodForWallet()`), dipetakan ke GoPay — pilihan interpretatif yang didokumentasikan secara eksplisit (QRIS paling umum dibayar lewat e-wallet di Indonesia), bukan klaim atas riwayat nyata. Efek samping baik: beberapa label kategori yang sebelumnya menyimpang dari katalog (`categories.ts`) — mis. "Kebutuhan Rumah" → seharusnya "Belanja Kebutuhan", ikon "bolt"/"health_and_safety" yang tidak ada di katalog — ikut diselaraskan, sehingga `getCategoryByIcon()` di `TransactionRow` tidak lagi jatuh ke fallback warna generik untuk data ini.
- **Reducer `finance-context.tsx` diperluas**: `UPDATE_TRANSACTION` (membalik delta lama dari `walletId` lama transaksi, lalu menerapkan delta baru ke `walletId` baru — dua langkah independen sehingga ganti dompet SEKALIGUS ganti nominal/arah tetap presisi), `DELETE_TRANSACTION` (membalik delta dari `walletId`-nya lalu menghapus), `ADD_WALLET`/`UPDATE_WALLET`/`DELETE_WALLET`. `UPDATE_WALLET` **sengaja tidak menerima `balance`** — saldo dompet hanya boleh berubah lewat transaksi, bukan lewat form edit, supaya selalu presisi terhadap riwayat (permintaan eksplisit "tanpa kebocoran/desinkronisasi"). `DELETE_WALLET` menolak (no-op) jika dompet masih punya transaksi terkait, mencegah `walletId` yatim.
- **Diverifikasi end-to-end di Chrome dengan angka nyata**: edit trx-1 dari Rp45rb→Rp95rb → saldo Kas Tunai turun tepat Rp50rb; hapus trx-1 → saldo naik tepat Rp95rb (delta penuh dibalik); tambah dompet baru → hapus dompet tanpa riwayat → sukses; coba hapus dompet **dengan** riwayat → ditolak dengan pesan jelas, tidak ada data hilang.

### 9.2 Kategori: Duit Masuk sekarang punya set sendiri

- `categories.ts`: setiap `CategoryOption` mendapat `appliesTo: TransactionDirection[]`. 3 kategori income baru — **Gaji** (ikon `payments`, persis ikon yang sudah dipakai trx-2 sejak awal — kini beneran match), **Bonus & Hadiah**, **Investasi & Dividen** — dibangun dari kombinasi token warna yang SUDAH dipakai di katalog (tidak ada warna baru diciptakan). "Usaha" dan "Lainnya" berlaku untuk keduanya.
- Grid kategori di Catat Transaksi (`transaksi/tambah/page.tsx`) di-filter via `getCategoriesForDirection(direction)`; beralih tab Duit Keluar/Masuk otomatis reset pilihan kategori ke default arah yang baru jika pilihan lama tidak berlaku lagi.

### 9.3 Dua layar baru diaktifkan dari aset Stitch yang belum pernah dipakai

- **Detail Transaksi** (`src/app/transaksi/[id]/page.tsx`, rute dinamis) — diporting dari `detail_transaksi_light.html`. File itu ternyata **dark-only** (hex hardcode, sama seperti kasus Laporan/Profil §5–6) meski namanya "_light" — didekati dengan pola yang sama: markup + hierarki dibangun ulang dengan token standar, bukan hex literal. Kartu "Rincian Pembayaran" aslinya berisi "Subtotal Menu"/"Biaya Layanan" contoh fiktif khusus skenario makan ramen di mockup — diganti "Nominal Transaksi" + "Biaya Admin Rp 0 (Gratis, akurat untuk SEMUA transaksi karena app ini memang belum punya sistem biaya)" + "Total" — bentuk kartu & posisi tetap sama, isi jadi jujur & generik untuk transaksi apa pun. "ID Referensi" & "Metode Bayar" memakai data asli (`transaction.id`, `transaction.paymentMethod`) — bukan string contoh. Tombol "Edit" mengarahkan ke `/transaksi/tambah?id=...` (pakai ulang form yang sudah ada, bukan UI baru); "Hapus Data" memanggil `deleteTransaction` sungguhan di belakang `confirm()`.
- **Kelola Dompet** (`src/app/dompet/page.tsx`) — diporting dari `kelola_dompet_light.html` (dark-nya juga hex hardcode, diabaikan dengan alasan sama). Header disesuaikan ke pola "layar pushed" yang sudah baku di app ini (back+title+avatar, sama seperti Catat Transaksi) karena desain Stitch aslinya mengasumsikan ini tab bottom-nav tersendiri — yang tidak ada di `BottomNav` KoZa (5 tab tetap tidak diubah). Kartu per-dompet Stitch aslinya mengelompokkan GoPay+OVO jadi satu kartu gabungan (cocok untuk 4 data demo spesifik, tidak generalizable ke CRUD) — direnderkan ulang sebagai satu template kartu per-dompet (`.map()` atas `wallets`), memakai kembali persis styling/token yang sama. Statistik "Pemasukan bln ini"/"Pengeluaran tunai" yang di mockup adalah angka contoh — diganti "Transaksi bulan ini" riil per dompet lewat fungsi baru `getWalletMonthlyNet()` (`finance.ts`), memungkinkan sekarang karena tiap transaksi sudah py `walletId`.
  - Form tambah/edit dompet (bottom sheet) **tidak ada mockup Stitch persis untuk ini** — dibangun dari pola yang SUDAH tervalidasi di tempat lain (toggle segmented dari Catat Transaksi, baris input dari Catat Transaksi, tombol destruktif `error-container` dari Profil) alih-alih menciptakan bahasa visual baru.
- **Afforansi palsu diperbaiki**: `TransactionListItem` (Beranda) dan `TransactionRow` (Riwayat) sudah punya styling "bisa diklik" (`cursor-pointer`, hover, `active:scale`) sejak awal tapi klik-nya tidak melakukan apa pun — sekarang keduanya navigasi ke Detail Transaksi sungguhan. Link "Daftar Dompet Manual" di Profil (`href="#"`) diarahkan ke `/dompet`.

### 9.4 Bug teknis lain yang ditemukan & diperbaiki dalam proses

- `package.json` (`name`) dan `layout.tsx` (`<title>`) masih menyebut `"laporan-keuangan"`/"Laporan Keuangan" — sisa sebelum rebrand ke KoZa. Diperbaiki ke `"koza"` / "KoZa".
- `<a href="/transaksi">` polos di Beranda ("Lihat Semua") diganti `next/link`'s `<Link>` — sebelumnya memicu full page reload alih-alih navigasi client-side (`@next/next/no-html-link-for-pages`), ditemukan lewat full-repo lint pertama sesi ini.
- `laporan/page.tsx`: akumulator `let dashCursor` yang di-mutate di dalam `.map()` (untuk cumulative dash-offset donut chart) kena error lint `react-hooks/immutability` — diganti perhitungan murni tanpa mutasi (re-sum per slice, aman karena jumlah slice selalu ≤4).
- `transaksi/page.tsx`: dua `useMemo` untuk filter/grouping (dataset kecil, tidak butuh memoization) kena error `react-hooks/preserve-manual-memoization` — disederhanakan jadi `const` biasa.
- Form edit transaksi (`transaksi/tambah/page.tsx`) awalnya prefill lewat `useEffect` yang memanggil banyak `setState` sekaligus — kena `react-hooks/set-state-in-effect` (persis pola yang sama seperti bug hidrasi `FinanceContext` di §8). Diperbaiki dengan pola resmi React "adjust state during render" (`if (editingTransaction && prefilledForId !== id) { setState(...); ... }` langsung di body komponen, bukan di effect) — bukan `useEffect` maupun `useRef`, karena di sini prefill-nya memang harus memicu render baru dengan nilai form yang benar, beda dari kasus §8 yang cuma butuh gate satu kali tanpa re-render.

### 9.5 Sengaja tidak dikerjakan sesi ini (di luar cakupan)

Konsisten dengan disiplin skop dari audit: ekspor CSV/PDF ("Unduh"/"Ekspor Laporan"), layar manajemen Kategori Transaksi custom (`kategori_light/dark.html` — belum diporting), validasi saldo-tidak-boleh-minus, filter lanjutan Riwayat, unit test otomatis, PWA (manifest/service worker/ikon), backend+autentikasi, dan security headers — semua tetap masuk daftar "Fase Rilis Berikutnya" seperti sudah direkomendasikan di audit, tidak disentuh di sesi ini.

### 9.6 Verifikasi akhir

`npx tsc --noEmit` bersih, `npx eslint .` 0 error (4 warning font — sudah didokumentasikan sejak §2, sengaja dipertahankan demi fidelitas render Stitch), `npm run build` sukses 100% (9 route, termasuk `/dompet` baru dan `/transaksi/[id]` dinamis). Alur CRUD penuh diuji manual di Chrome dengan pembacaan langsung `localStorage` untuk memverifikasi presisi matematis saldo di setiap langkah (edit, hapus, tambah dompet, hapus dompet, guard hapus dompet).

## 10. Status & Checklist Lanjutan (checkpoint darurat — usage limit sesi)

**Kondisi saat commit ini:** semua pekerjaan §9 (CRUD transaksi & dompet, penyesuaian kategori, 2 layar baru, bugfix teknis) sudah selesai, terverifikasi (`tsc`/`eslint`/`build` bersih, diuji manual di Chrome dengan pengecekan matematis saldo), dan di-commit ke branch `main`. Working tree bersih setelah commit ini. **Repo belum punya git remote** (`git remote -v` kosong) — tidak bisa di-push sampai remote dikonfigurasi.

**Checklist lanjutan (dari §9.5, belum dikerjakan, urutan bebas sesuai prioritas):**
- [ ] Ekspor CSV/PDF — isi tombol "Unduh" (Laporan) & "Ekspor Laporan" (Profil), keduanya masih dekoratif
- [ ] Layar Kategori Transaksi custom — aset Stitch `kategori_light.html`/`kategori_dark.html` ada di scratchpad lama, belum diporting; link "Kategori Transaksi" di Profil masih `href="#"`
- [ ] Validasi saldo tidak boleh minus saat transaksi expense melebihi saldo dompet
- [ ] Filter lanjutan di Riwayat — tombol "Buka Filter Lanjutan" (`tune` icon) masih dekoratif
- [ ] Unit test otomatis untuk fungsi murni (`finance.ts`, `report.ts`, `format.ts`) — belum ada test runner di project sama sekali
- [ ] PWA readiness — manifest.json, service worker, ikon app kustom (masih pakai SVG default create-next-app di `/public`)
- [ ] Backend + autentikasi nyata (di luar localStorage satu-browser)
- [ ] Security headers sebelum deploy publik

**Cara melanjutkan sesi berikutnya:** baca §9 untuk konteks arsitektur CRUD (terutama pola `walletId`/`categoryId` dan kenapa `UPDATE_WALLET` sengaja tidak menerima `balance`), lalu pilih item checklist di atas sesuai prioritas berikutnya.
