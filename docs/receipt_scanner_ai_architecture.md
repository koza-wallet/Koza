# Arsitektur & Logika AI Receipt Scanner (KoZa)

Dokumen ini menjelaskan rancangan integrasi kecerdasan buatan (AI) ke dalam aplikasi KoZa untuk fitur pemindaian struk (Receipt Scanner).

## 1. Tujuan Fitur
Memungkinkan pengguna untuk memindai (foto/unggah) struk belanja, yang kemudian secara otomatis dianalisis oleh AI untuk mengekstrak data transaksi seperti:
- Nama Merchant/Toko
- Total Harga
- Tanggal Transaksi
- Kategori Pengeluaran (disimpulkan secara otomatis)

## 2. Pilihan Teknologi AI
Mengingat kompleksitas membaca teks dari gambar yang tidak terstruktur, kita akan menggunakan **Google Gemini 1.5 Pro Vision API** (atau versi setara) yang dioptimalkan untuk pengenalan gambar (OCR + NLU). Model Vision mampu mengekstrak teks sekaligus memahami konteks secara semantik, jauh lebih baik daripada Tesseract OCR tradisional.

## 3. Alur Logika (Workflow)

1. **User Input (Frontend):**
   - Pengguna menekan tombol "Scan Struk" di halaman Catat Transaksi.
   - Kamera atau galeri terbuka.
   - Pengguna memfoto struk (sebaiknya diperkecil ukurannya/dikompres sebelum dikirim untuk menghemat *bandwidth*).

2. **API Route (Backend - Next.js):**
   - Gambar dikirim ke *endpoint* API (misal: `/api/ai/scan-receipt`) menggunakan format Base64 atau FormData.
   - Server mengonstruksi *Prompt* spesifik yang diinstruksikan untuk menghasilkan output berformat JSON murni.

   **Contoh Prompt System:**
   ```text
   Anda adalah asisten keuangan pintar. Analisis gambar struk belanja ini dan ekstrak informasi berikut ke dalam format JSON yang valid.
   Struktur JSON yang diharapkan:
   {
     "merchant": "Nama Toko",
     "totalAmount": 150000,
     "date": "2026-09-07T00:00:00Z",
     "suggestedCategory": "food",
     "confidenceScore": 90
   }
   Jika tidak ada informasi yang ditemukan, kembalikan nilai null.
   ```

3. **Pemrosesan AI:**
   - Gemini Vision memproses gambar dan mengekstrak data berdasarkan prompt.
   - Server menerima respons JSON.

4. **Response Handling:**
   - Server mem-parsing JSON, memvalidasi integritas data (apakah format tanggal benar, apakah angka total valid).
   - Server mengirim balik JSON ke *frontend*.

5. **Auto-Fill Form (Frontend):**
   - Aplikasi secara otomatis mengisi kolom formulir "Catat Transaksi" (Judul = Merchant, Nominal = TotalAmount, Kategori = Hasil Pemetaan AI).
   - Pengguna masih dapat memodifikasi (mengedit) isian tersebut sebelum menekan "Simpan".

## 4. Keamanan & Privasi
- Gambar struk yang diunggah diproses secara sinkron (stateless) dan tidak disimpan secara permanen di server maupun database (kecuali pengguna sengaja ingin menyimpannya untuk keperluan garansi/pajak).
- Pastikan API Key Gemini dilindungi di `.env` (server-side) dan tidak pernah diekspos ke publik (Client Components).

## 5. Rencana Skalabilitas (SaaS)
- Pemrosesan gambar memakan biaya token yang cukup besar. Oleh karena itu, fitur ini dapat dikunci **hanya untuk pengguna PRO**.
- Pengguna FREE dapat diberikan batas kuota uji coba (misal: 3x scan pertama).
