import Link from "next/link";

const faqs = [
  {
    q: "Bagaimana cara mencatat transaksi baru?",
    a: "Di halaman utama (Beranda), tekan tombol bulat '+' berwarna biru di bagian bawah layar. Anda bisa memilih apakah itu 'Pengeluaran' atau 'Pemasukan', lalu isi nominal dan kategorinya.",
  },
  {
    q: "Bagaimana cara menambah dompet atau rekening?",
    a: "Masuk ke menu Profil, lalu pilih 'Daftar Dompet Manual' di bagian Kelola Keuangan. Klik tombol 'Tambah Dompet' dan isi detail dompet Anda.",
  },
  {
    q: "Apa perbedaan akun Personal (FREE) dan PREMIUM?",
    a: "Akun Personal memiliki fitur dasar pencatatan tanpa batas. Akun PREMIUM memiliki akses fitur eksklusif seperti Pengingat Harian (Push Notifications) dan fitur analitik lanjutan yang sedang kami kembangkan.",
  },
  {
    q: "Apakah data saya aman?",
    a: "Sangat aman! Data Anda disimpan menggunakan database cloud terenkripsi dari Supabase, dan kami tidak pernah membagikan data finansial Anda kepada pihak ketiga.",
  },
  {
    q: "Bagaimana cara menghapus transaksi yang salah?",
    a: "Buka halaman Riwayat (ikon jam di navigasi bawah), cari transaksi yang ingin dihapus, lalu klik transaksi tersebut dan tekan tombol 'Hapus' berwarna merah.",
  }
];

export default function BantuanPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-screen flex items-center gap-space-sm">
          <Link
            href="/profil"
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors active:scale-95"
            aria-label="Kembali ke profil"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
            Bantuan & Dukungan
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-safe px-margin-screen space-y-space-xl max-w-2xl mx-auto w-full">
        
        {/* Intro */}
        <section className="text-center space-y-space-xs">
          <div className="w-16 h-16 bg-primary-container text-primary rounded-2xl flex items-center justify-center mx-auto mb-space-md rotate-3 shadow-sm">
            <span className="material-symbols-outlined text-[32px]">support_agent</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Ada yang bisa kami bantu?</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Temukan jawaban cepat atau hubungi tim kami
          </p>
        </section>

        {/* Contact Support */}
        <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-container-low space-y-space-sm">
          <h3 className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider mb-space-xs">
            Hubungi Customer Service
          </h3>
          <a
            href="https://wa.me/6289524372018?text=Halo%20Tim%20Koza,%20saya%20butuh%20bantuan."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#075E54] rounded-xl transition-colors group"
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[#25D366]">chat</span>
              <span className="font-label-lg text-label-lg font-semibold">Chat WhatsApp</span>
            </div>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </a>
          
          <a
            href="mailto:dalamsistem@gmail.com?subject=Bantuan%20Aplikasi%20Koza"
            className="w-full flex items-center justify-between p-4 bg-primary-container/50 hover:bg-primary-container text-on-primary-container rounded-xl transition-colors group"
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary">mail</span>
              <span className="font-label-lg text-label-lg font-semibold">Email Kami</span>
            </div>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </a>
        </section>

        {/* FAQ Accordion */}
        <section className="space-y-space-sm pb-10">
          <h3 className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider mb-space-md px-1">
            Pertanyaan Umum (FAQ)
          </h3>
          <div className="space-y-space-xs">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-surface-container-low [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-surface-container-low transition-colors font-label-lg text-label-lg text-on-surface">
                  <span className="pr-4">{faq.q}</span>
                  <span className="material-symbols-outlined text-on-surface-variant group-open:rotate-180 transition-transform duration-300 flex-shrink-0">
                    keyboard_arrow_down
                  </span>
                </summary>
                <div className="px-4 pb-4 pt-1 font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
