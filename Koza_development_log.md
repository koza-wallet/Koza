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

**Checklist lanjutan (dari §9.5) — status setelah §11:**
- [x] Ekspor CSV — isi tombol "Unduh" (Laporan) & "Ekspor Laporan" (Profil). **Catatan: CSV saja, bukan PDF** (lihat §11.2 untuk alasan).
- [x] Layar Kategori Transaksi custom — diporting dari `kategori_light.html` (lihat §11.1); link "Kategori Transaksi" di Profil sekarang mengarah ke `/kategori`.
- [x] Validasi saldo tidak boleh minus saat transaksi expense melebihi saldo dompet — lihat §11.3.
- [x] Filter lanjutan di Riwayat — tombol "Buka Filter Lanjutan" (`tune` icon) sekarang membuka bottom sheet filter dompet + urutan — lihat §11.4.
- [ ] Unit test otomatis untuk fungsi murni (`finance.ts`, `report.ts`, `format.ts`) — belum ada test runner di project sama sekali
- [ ] PWA readiness — manifest.json, service worker, ikon app kustom (masih pakai SVG default create-next-app di `/public`)
- [ ] Backend + autentikasi nyata (di luar localStorage satu-browser)
- [ ] Security headers sebelum deploy publik

**Cara melanjutkan sesi berikutnya:** baca §9 untuk konteks arsitektur CRUD (terutama pola `walletId`/`categoryId` dan kenapa `UPDATE_WALLET` sengaja tidak menerima `balance`), lalu §11 untuk pekerjaan sesi ini, lalu §12 untuk status commit paling akhir dan checklist yang masih tersisa.

## 11. Eksekusi Dead Links, Ekspor CSV, Validasi Saldo, Layar Kategori

Sesi ini mengeksekusi seluruh 4 item checklist §10 di atas (kecuali unit test/PWA/backend/security headers, tetap di luar cakupan), dengan guardrail yang sama seperti sebelumnya: **tidak ada layout/token/tipografi Stitch yang diubah** — hanya fungsionalitas, data, dan (di satu tempat) copy yang tidak akurat lagi (lihat §11.2) yang disentuh.

### 11.1 Layar baru: Kelola Kategori (`/kategori`)

- Aset sumber `kategori_light.html`/`kategori_dark.html` sudah tidak ada di scratchpad sesi manapun yang aktif (scratchpad bersifat sesi-lokal dan terhapus), tapi ditemukan kembali di direktori scratchpad sesi lama yang masih tersisa di filesystem. **Temuan penting:** file `kategori_dark.html` di sana ternyata bukan varian dark dari layar Kategori sama sekali — isinya adalah duplikat/salah label dari export "Detail Transaksi" (ramen_dining, dsb.). Jadi hanya `kategori_light.html` yang benar-benar valid sebagai sumber, dan itu pun sudah memakai token warna standar (bukan hex hardcode) — konsisten dengan pola §5/§6/§9.3 untuk selalu membangun dari token standar theme-aware, bukan mengejar export "_dark" yang literal.
- Header diadaptasi ke pola "layar pushed" standar aplikasi ini (back+title+avatar, sama seperti Kelola Dompet/Detail Transaksi) karena markup asli Stitch mengasumsikan ini tab bottom-nav tersendiri, yang tidak ada di `BottomNav` KoZa (5 tab tetap tidak diubah).
- **Semua angka fiktif di markup asli diganti data riil**, mengikuti prinsip §4.1: badge jumlah kategori di tab Duit Keluar/Masuk (Stitch: "12"/"5" statis) → `getCategoriesForDirection(direction).length` riil (aktual 8/5). "Anggaran Rp 2.500.000" per kategori (butuh sistem budget yang belum dibangun, sama alasannya dengan §5) → diganti "{N} transaksi bulan ini • Rp {total}" riil dari fungsi baru `getCategoryMonthlyStats()` (`finance.ts`). Badge "Rutin" (tak ada model data pendukung) dihapus; badge "Primer" dipertahankan tapi hanya muncul untuk kategori yang benar-benar `DEFAULT_EXPENSE_CATEGORY_ID`/`DEFAULT_INCOME_CATEGORY_ID` — fakta nyata (kategori pre-selected di form Catat Transaksi), bukan klaim kosong. Kartu "Pemanfaatan Kategori" di bawah dihitung dari kategori dengan nominal terbesar bulan ini per arah aktif, bukan teks statis "Makan & Minum 48%".
- Pencarian (`Cari nama kategori...`) dan tab segmented Duit Keluar/Masuk yang di export Stitch aslinya cuma vanilla-JS dekoratif, sekarang benar-benar memfilter `getCategoriesForDirection()` secara real-time. Tombol "Urutan" (`swap_vert`, dekoratif di Stitch) sekarang toggle urutan abjad asc/desc riil. Ikon search di header memfokuskan input pencarian di body (bukan aksi terpisah yang dekoratif).
- Setiap kartu kategori (termasuk ikon pensil "edit") navigasi ke `/transaksi?category={id}` — membuka Riwayat yang sudah difilter ke kategori itu (lihat §11.4). Ini interpretasi yang disengaja: aplikasi ini tidak punya model kategori yang bisa diedit pengguna (kategori adalah katalog tetap di `categories.ts`, dipakai lintas layar/warna — mengubahnya jadi editable adalah perubahan skema besar yang tidak diminta sesi ini), jadi "edit" di sini diarahkan ke aksi yang benar-benar didukung: meninjau transaksi kategori tersebut.
- Tombol "+ Tambah Kategori Baru" — karena alasan yang sama (tidak ada model kategori kustom), tidak dibuat pura-pura berfungsi. Diberi toast honest "Kategori kustom akan hadir di rilis mendatang" (pola toast yang sama persis dengan yang sudah ada di Detail Transaksi), bukan dead click yang benar-benar tanpa respons apa pun.

### 11.2 Ekspor CSV (bukan PDF)

- `src/lib/csv-export.ts` baru: `transactionsToCsv()` menghasilkan CSV dengan kolom Tanggal, Waktu, Judul, Kategori, Arah, Nominal (Rp, angka polos tanpa pemisah ribuan — lebih ramah untuk dibaca ulang sebagai angka oleh Excel/Sheets), Dompet, Metode Pembayaran, Catatan — dengan escaping CSV yang benar (quote + double-quote utk field yang mengandung koma/kutip/newline). `downloadCsv()` memicu unduhan file nyata lewat `Blob` + elemen `<a download>` sementara (dengan BOM UTF-8 agar karakter "Rp"/nama kategori tampil benar di Excel).
- **Sengaja hanya CSV, tidak ada PDF** — sesuai saran eksplisit di instruksi sesi ini ("generate file CSV dari transaksi aktif di localStorage") dan prinsip §4 (tidak menambah dependency/abstraksi di luar yang diminta): PDF butuh library render tambahan yang tidak ada alasan kuat untuk diinstal hanya demi satu tombol unduh. Copy "Unduh pembukuan berkala CSV / PDF" di Profil diubah jujur jadi "Unduh pembukuan CSV seluruh riwayat transaksi" — perubahan teks, bukan layout, agar tidak menjanjikan sesuatu yang tidak dibangun (prinsip §5/§6).
- Tombol "Unduh" di Laporan mengekspor transaksi periode yang sedang dilihat saja (`report.rangeStart`–`report.rangeEnd`, mengikuti granularitas & navigasi periode yang aktif), nama file mengikut periode (mis. `koza-laporan-bulanan-juli-2026.csv`). "Ekspor Laporan" di Profil mengekspor seluruh riwayat transaksi (`koza-riwayat-transaksi.csv`) — elemen `<a href="#">` diubah jadi `<Link href="/kategori">`/`<button onClick>` (tag semantik yang benar untuk navigasi vs. aksi), kelas Tailwind dipertahankan identik.

### 11.3 Validasi saldo — cegah pengeluaran melebihi saldo dompet

- Di `handleSave()` (`transaksi/tambah/page.tsx`), sebelum menyimpan transaksi expense: dihitung `availableBalance` = saldo dompet terpilih saat ini, ditambah kembali nominal transaksi lama **jika** sedang mode edit dan dompet+arahnya sama seperti sebelumnya (karena proses edit akan membalik delta lama sebelum menerapkan delta baru — lihat reducer `UPDATE_TRANSACTION` di §9.1 — jadi nominal lama itu ikut "tersedia" lagi untuk edit ini). Jika nominal baru melebihi `availableBalance`, disimpan dibatalkan dan pesan error ramah muncul di slot error yang sudah ada di UI (`amountError`, sama seperti pesan "Nominal belum diisi"): `"Saldo {nama dompet} tidak cukup — tersedia Rp {angka}"`. Tidak memakai `window.alert()` — memakai slot pesan inline yang sudah konsisten dipakai form ini.
- Guard nominal diperketat dari `rawAmount <= 0` jadi `!Number.isFinite(rawAmount) || rawAmount <= 0` (defensif terhadap nilai non-finite).
- Input "Saldo awal" di form Tambah Dompet (`dompet/page.tsx`) — sebelumnya `Number(e.target.value) || 0` bisa menerima negatif (mis. mengetik "-50000" langsung lolos, atribut HTML `min={0}` cuma hint visual, tidak divalidasi lewat JS) dan desimal (mis. "50000.5"). Diperbaiki dengan clamp di `onChange`: `Math.max(0, Math.floor(Number(e.target.value) || 0))` — string kosong/NaN jatuh ke 0, negatif dipotong ke 0, desimal dibulatkan ke bawah.

### 11.4 Riwayat: filter lanjutan + deep-link kategori

- Tombol "Buka Filter Lanjutan" (`tune`, sebelumnya dekoratif) sekarang membuka bottom sheet (pola visual identik dengan sheet tambah/edit dompet di Kelola Dompet — tidak ada bahasa visual baru): filter "Dompet Sumber" (select tersembunyi di atas row, pola sama seperti selector dompet di Catat Transaksi) dan toggle "Urutan" (Terbaru Dahulu / Terlama Dahulu, pola segmented toggle sama seperti toggle arah transaksi). "Terapkan Filter" menutup sheet (state sudah live), "Reset Filter" mengembalikan ke default tanpa menutup sheet.
- Halaman ini sekarang juga baca query param `?category=<id>` (perlu `Suspense` boundary utk `useSearchParams()`, pola yang sama dengan `transaksi/tambah/page.tsx`) — dipakai kartu kategori di layar `/kategori` (§11.1) untuk deep-link. Saat aktif, muncul pill kecil di atas search bar menampilkan nama kategori + tombol "×" utk membersihkannya (`router.push("/transaksi")`).
- Pencarian teks & chip filter cepat (Semua/Duit Keluar/Duit Masuk/Bulan Ini) **sebenarnya sudah berfungsi sejak sesi sebelumnya** — bukan bagian dari perbaikan sesi ini, hanya tombol "tune" yang tadinya benar-benar dekoratif.

### 11.5 Sengaja tidak disentuh (di luar cakupan eksplisit sesi ini)

Tombol/link dekoratif yang TIDAK disebut eksplisit di instruksi sesi ini dibiarkan seperti semula, konsisten dengan preseden §6 ("elemen dekoratif tanpa model data dibiarkan statis"): tombol Top Up/Transfer/Kantong & "Analisis" di Beranda, seluruh ikon lonceng notifikasi di setiap header, gear "Pengaturan Lanjutan" & "Keamanan & PIN"/"Bantuan & Dukungan"/"Keluar dari Akun" di Profil. Semua ini butuh fitur backend/model data yang belum ada dan tidak diminta sesi ini — bukan terlewat, melainkan keputusan skop yang sama seperti sesi-sesi sebelumnya.

### 11.6 Verifikasi

`npx tsc --noEmit` bersih, `npx eslint .` 0 error (4 warning font yang sama, didokumentasikan sejak §2), `npm run build` sukses 100% (9 route termasuk `/kategori` baru).

## 12. Status & Checklist Lanjutan (checkpoint darurat — usage limit sesi, kelanjutan dari §10)

**Kondisi saat commit ini:** seluruh pekerjaan §11 (layar Kategori, ekspor CSV Laporan+Profil, validasi saldo, filter lanjutan Riwayat + deep-link kategori) sudah selesai, terverifikasi bersih (`tsc`/`eslint`/`build`, lihat §11.6), **dan sekarang juga sudah diverifikasi manual di Chrome** (lihat §12.1 di bawah). Working tree bersih. Repo masih belum punya git remote — tidak bisa di-push sampai remote dikonfigurasi.

### 12.1 Verifikasi manual browser (setelah reset usage limit)

- `/kategori` dimuat dengan benar: tab Duit Keluar/Duit Masuk menampilkan badge jumlah riil (8/5), badge "Default" hanya muncul di Makanan & Minuman (kategori default expense), daftar terurut abjad, subjudul per kategori menampilkan hitungan+nominal riil bulan ini.
- `/transaksi?category=makan` (deep-link dari kartu kategori): pill "Kategori: Makanan & Minuman" muncul dengan benar di atas search bar, daftar transaksi benar-benar terfilter hanya kategori itu.
- Tombol "Unduh" (`/laporan`) & "Ekspor Laporan" (`/profil`): diverifikasi dengan instrumentasi `HTMLAnchorElement.prototype.click` bahwa kedua tombol memicu unduhan `<a download>` dengan nama file yang benar (`koza-laporan-bulanan-juli-2026.csv` dan `koza-riwayat-transaksi.csv`), file benar-benar mendarat di `~/Downloads` dan isinya diperiksa manual: BOM UTF-8 ada, header kolom benar, nominal berupa angka polos, escaping benar. File uji dihapus lagi setelah verifikasi (bukan output yang perlu disimpan).
- **Temuan (bukan bug):** localStorage browser profil otomasi ini sudah punya data yang sedikit termodifikasi dari sesi verifikasi sebelumnya (persis transaksi `trx-1` "Makan Siang Resto" Rp 45.000 hilang dari total — total pengeluaran Juli konsisten Rp 1.775.000 bukan Rp 1.820.000 di semua layar yang dicek: Kategori, Riwayat, Laporan). Ini murni state `localStorage` lokal-browser yang tertinggal dari pengujian sebelumnya, bukan bug kode — dikonfirmasi karena semua layar konsisten satu sama lain menghitung dari data yang sama. Tidak memengaruhi data pengguna nyata (setiap browser punya `localStorage` sendiri-sendiri); pengguna baru selalu mulai dari `defaultState` yang utuh.
- **Belum sempat diverifikasi via klik langsung di browser:** validasi saldo (§11.3) di `/transaksi/tambah` — form wallet-selector-nya adalah native `<select>` yang tidak bisa diarahkan dengan andal lewat automation klik/keyboard (keterbatasan CDP terhadap dropdown native OS). Logikanya sudah diverifikasi lewat pembacaan kode baris-demi-baris (lihat diff `handleSave()`) dan secara matematis benar (menghitung `availableBalance` dengan reconciliation edit yang tepat), tapi belum ada klik nyata "cegah simpan" yang terekam di browser. Item ini didorong ke checklist di bawah untuk siapa pun yang punya akses mouse manual (uji dengan wallet bersaldo kecil, mis. OVO, dan coba input nominal pengeluaran yang melebihinya).

**Checklist lanjutan (belum dikerjakan, urutan bebas sesuai prioritas):**
- [ ] Verifikasi klik manual (bukan automation) untuk validasi saldo §11.3 di `/transaksi/tambah` — lihat catatan §12.1
- [ ] (Opsional) Bersihkan `localStorage` browser development (klik "Reset ke Data Awal" di Profil) sebelum demo, karena datanya sudah sedikit termodifikasi dari sesi pengujian — lihat temuan §12.1
- [ ] Unit test otomatis untuk fungsi murni (`finance.ts`, `report.ts`, `format.ts`) — belum ada test runner di project sama sekali
- [ ] PWA readiness — manifest.json, service worker, ikon app kustom (masih pakai SVG default create-next-app di `/public`)
- [ ] Backend + autentikasi nyata (di luar localStorage satu-browser)
- [ ] Security headers sebelum deploy publik
- [ ] (Opsional, tidak diminta eksplisit) Pertimbangkan apakah tombol dekoratif di §11.5 perlu difungsikan di masa depan, atau tetap dekoratif selamanya sebagai keputusan produk sadar

**Cara melanjutkan sesi berikutnya:** baca §11 untuk konteks lengkap pekerjaan sesi ini (terutama §11.1 soal kenapa `kategori_dark.html` diabaikan, dan §11.3 soal logika `availableBalance` saat edit), baca §12.1 untuk apa yang sudah/belum diverifikasi manual, lalu lanjut ke item checklist di atas sesuai prioritas.

## 13. Perbaikan Bug UX Mobile, Input Nominal, & Audit Logic Menyeluruh (6 September 2026)

### 13.1 Latar Belakang

Sesi ini dimulai dari laporan langsung pengguna saat live test di HP: (1) input nominal di `/transaksi/tambah` tidak bisa diketik, (2) pilihan kategori tidak merespons sentuhan, (3) tampilan nominal terpotong (`50000` muncul sebagai `50`). Seluruh sesi berfokus pada debugging interaktivitas mobile, perbaikan UX input, dan audit logic menyeluruh seluruh codebase.

### 13.2 Perbaikan Input Nominal — Format Separator Ribuan

**Akar masalah:** `formatRupiahAmount` menggunakan `Intl.NumberFormat("id-ID")` yang menghasilkan titik sebagai separator ribuan (e.g. `50.000`). Saat nilai yang sudah diformat dikembalikan ke `value` input dan pengguna mengetik karakter baru, ada edge case di mana `parseInt` menerima string yang belum sempurna distrip.

**Perbaikan di `src/app/transaksi/tambah/page.tsx`:**
- `handleAmountChange`: ditambah guard `!isNaN(parsed)` sebelum `setRawAmount`.
- Input mendapat `autoComplete="off"` untuk mencegah browser mobile menyuntikkan karakter non-digit.
- Tambah `onFocus={(e) => e.target.select()}` — saat input difokus, seluruh teks terpilih otomatis sehingga pengguna bisa langsung mengetik angka baru.

**Konsistensi format di seluruh app:** `formatRupiahAmount()` (`Intl.NumberFormat("id-ID")`) dipakai konsisten di Dashboard, Riwayat, Detail Transaksi, Laporan, Form Catat Transaksi, dan Kelola Dompet — menghasilkan format titik ribuan yang seragam (e.g. `50.000`, `1.360.000`).

### 13.3 Perbaikan Interaksi Kategori — `pointer-events-none`

**Masalah:** kartu/tombol kategori tidak merespons sentuhan di Android.

**Akar masalah:** di beberapa Android, event sentuhan pada `<button>` bisa "diserap" oleh elemen anak yang tidak memiliki `pointer-events: none` — terutama `<span>` ikon Material Symbols yang menerima pointer event sendiri, memblokir propagasi ke `<button>` induk.

**Perbaikan:** semua elemen anak dalam kartu kategori (`div` ikon, `span` ikon font, `span` nama, `span` checkmark SVG) diberi kelas `pointer-events-none`. Indikator seleksi diperkuat: `border` (1px) → `border-2`, `bg-primary/10` → `bg-primary/15`.

### 13.4 Penghapusan Tombol Bantuan Nominal

**Permintaan pengguna:** hapus tombol bantuan (+10rb, +20rb, +50rb, +100rb, +000, Reset) dari form Catat Transaksi.

**Yang dihapus dari `src/app/transaksi/tambah/page.tsx`:**
- Konstanta `QUICK_AMOUNTS`
- Fungsi `addAmount()`, `appendZeros()`, `resetAmount()` (dead code)
- Seluruh blok JSX "Quick Amount Chips & Tools" + tombol "Smart helper"
- Teks hint diperbarui: _"Ketuk area angka lalu ketik jumlah nominal"_

### 13.5 Perbaikan Bug Arah Panah — Detail Transaksi

**Bug di `src/app/transaksi/[id]/page.tsx`:** logika ikon panah terbalik.

```diff
- {isIncome ? "arrow_downward" : "arrow_upward"}
+ {isIncome ? "arrow_upward" : "arrow_downward"}
```

Pemasukan = panah naik (↑), pengeluaran = panah turun (↓).

### 13.6 Perbaikan Nama Produk — Halaman Profil

Teks stale di `src/app/profil/page.tsx` diperbaiki:

```diff
- Kelola preferensi dan akun Dompetku Anda
+ Kelola preferensi dan akun KoZa Anda
```

### 13.7 Konfigurasi `allowedDevOrigins` untuk Live Test di HP

Next.js dev server memblokir HMR dari IP lokal HP (`10.166.152.36`). Ditambahkan di `next.config.ts`:

```ts
allowedDevOrigins: ["10.166.152.36", "localhost"],
```

Dev server di-restart. HP kini menerima Fast Refresh tanpa blokir.

### 13.8 Audit Logic Menyeluruh — Temuan & Perbaikan

Dilakukan audit terhadap seluruh codebase: `types.ts`, `finance-context.tsx`, `finance.ts`, `report.ts`, `format.ts`, `categories.ts`, `csv-export.ts`, dan semua halaman.

#### Bug nyata yang ditemukan dan diperbaiki:

| # | File | Bug | Perbaikan |
|---|---|---|---|
| 1 | `tambah/page.tsx` | `walletId` diinisialisasi sekali dari `wallets[0]?.id` saat mount — tapi `wallets` bisa berubah setelah HYDRATE dari localStorage, berpotensi mengirim `walletId` yang tidak valid | Diubah ke `useState("")` + `resolvedWalletId` (derived: cek apakah walletId masih ada di `wallets` aktual) + `defaultWalletId` dari `useMemo([wallets])` |
| 2 | `tambah/page.tsx` | Fungsi `resetAmount()` masih ada sebagai dead code setelah tombol Reset dihapus | Dihapus sepenuhnya |
| 3 | `transaksi/page.tsx` | Warna indikator net header grup: `net >= 0` (termasuk `0`) semua berwarna hijau primary | Diubah ke logika tiga-kondisi: `net > 0` = primary (hijau), `net < 0` = tertiary (merah), `net = 0` = outline (abu/netral) |
| 4 | `dompet/page.tsx` | Warna `monthly.net >= 0` di footer kartu dompet — masalah sama dengan poin 3 | Logika tiga-kondisi yang sama |
| 5 | `dompet/page.tsx` | Input saldo awal menggunakan `type="number"` — tidak konsisten, rentan scroll tidak sengaja di mobile, tidak ada guard overflow, bisa menerima desimal | Diganti ke `type="text" inputMode="numeric"` + format separator titik otomatis, `onFocus` select-all, guard `parseInt` + `Math.min(999_999_999_999, ...)` |

#### Logic yang sudah benar (tidak perlu diubah):

- `finance-context.tsx` — Balance reversal dua langkah di UPDATE/DELETE_TRANSACTION ✅
- `finance-context.tsx` — Guard HYDRATE vs persist (skipNextPersistRef) ✅
- `finance-context.tsx` — DELETE_WALLET guard jika masih ada histori ✅
- `report.ts` — `startOfWeek`, `getRange`, `sumInRange`, `pctChange` ✅
- `finance.ts` — `groupTransactionsByDay`, `getMonthlySummary`, `getWalletMonthlyNet` ✅
- `csv-export.ts` — Filter range, UTF-8 BOM ✅
- `tambah/page.tsx` — Validasi saldo cukup sebelum simpan ✅
- `tambah/page.tsx` — Edit mode: restore saldo lama sebelum kalkulasi delta baru ✅

### 13.9 Verifikasi

`npx tsc --noEmit` → **0 error**. `npx eslint` pada semua file yang diubah → **0 error**.

Dev server berjalan di `http://localhost:3000` (juga `http://10.166.152.36:3000` dari HP di jaringan yang sama).

### 13.10 Status Checklist (diperbarui dari §12)

- [x] Bug panah arah terbalik di Detail Transaksi — diperbaiki §13.5
- [x] Interaksi kategori tidak merespons di HP — diperbaiki §13.3
- [x] Input nominal terpotong / tidak bisa diketik — diperbaiki §13.2
- [x] Nama produk "Dompetku" masih tersisa di Profil — diperbaiki §13.6
- [x] `allowedDevOrigins` untuk HMR di HP — dikonfigurasi §13.7
- [x] Audit logic menyeluruh seluruh codebase — selesai §13.8
- [ ] Unit test otomatis untuk fungsi murni (`finance.ts`, `report.ts`, `format.ts`)
- [ ] PWA readiness — manifest.json, service worker, ikon app kustom
- [ ] Backend + autentikasi nyata (di luar localStorage satu-browser)
- [ ] Security headers sebelum deploy publik

## 14. Implementasi Unit Test & PWA (6 September 2026)

### 14.1 Latar Belakang

Melanjutkan dari sesi sebelumnya, pengguna meminta untuk mengerjakan checklist prioritas:
1. Unit Test otomatis untuk fungsi murni (`finance.ts`, `report.ts`, `format.ts`).
2. PWA readiness (Progressive Web App) agar KoZa bisa dipasang di *homescreen* dan bekerja secara offline/caching.

### 14.2 Unit Test dengan Vitest

**Alat yang digunakan:** `vitest`
**File yang diuji:**
- `format.test.ts`: Menguji `formatRupiahAmount`, `formatCompactRupiah`, dan `formatTerbilang`. 
  - *Perbaikan Bug:* Memperbaiki ekspektasi test karena `formatCompactRupiah` adalah fungsi yang benar untuk singkatan (bukan `formatSignedRupiahCompact` yang tidak menyingkat angka).
- `finance.test.ts`: Menguji fungsi agregasi keuangan murni seperti `getTotalBalance`, `isSameMonth`, `getMonthlySummary`, dan `groupTransactionsByDay`.
- `report.test.ts`: Menguji `shiftAnchor` dan fungsi pembuatan laporan bulanan `getPeriodReport`.

**Hasil:**
- Seluruh tes lulus (9/9 pass).

### 14.3 Setup PWA dengan Serwist

**Alat yang digunakan:** `@serwist/next` (penerus modern `next-pwa`)
**Langkah Implementasi:**
1. **Manifest & Ikon:** 
   - Membuat gambar logo kustom "Dompet Minimalis" menggunakan image generator (AI) untuk `icon-192x192.png` dan `icon-512x512.png`.
   - Menambahkan `public/manifest.json`.
2. **Metadata Layout:**
   - Menyuntikkan `manifest` dan `appleWebApp` configuration ke dalam export `metadata` Next.js di `src/app/layout.tsx`.
   - Menambahkan `themeColor: "#10b981"` ke export `viewport`.
3. **Service Worker:**
   - Membuat `src/app/sw.ts` dengan konfigurasi *default cache* dari `serwist`.
4. **Konfigurasi Next.js:**
   - Memodifikasi `next.config.ts` untuk menggunakan *wrapper* `withSerwistInit`.
   - Memodifikasi script `dev` di `package.json` menjadi `next dev --webpack` karena Serwist membutuhkan Webpack (Next.js 16 menggunakan Turbopack secara default).

### 14.4 Status Checklist (diperbarui dari §13)

- [x] Unit test otomatis untuk fungsi murni (`finance.ts`, `report.ts`, `format.ts`) — **selesai §14.2**
- [x] PWA readiness — manifest.json, service worker, ikon app kustom — **selesai §14.3**
- [ ] Backend + autentikasi nyata (di luar localStorage satu-browser)
- [x] Security headers sebelum deploy publik — **selesai §14.5**

### 14.5 Implementasi Security Headers

**Langkah Implementasi:**
1. Menambahkan `securityHeaders` pada `next.config.ts`.
2. Headers yang ditambahkan meliputi `X-DNS-Prefetch-Control`, `Strict-Transport-Security`, `X-XSS-Protection`, `X-Frame-Options`, `X-Content-Type-Options`, dan `Referrer-Policy`.
3. Memperbaiki error TypeScript pada `src/app/sw.ts` dengan menambahkan `/// <reference lib="webworker" />`.
4. Menambahkan `--webpack` pada `next build` agar serwist berfungsi di Next.js 16 yang default-nya menggunakan Turbopack.
