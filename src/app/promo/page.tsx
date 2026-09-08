"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PromoPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050B14] font-sans text-white overflow-x-hidden selection:bg-primary/30 selection:text-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-[#050B14]/90 backdrop-blur-md shadow-sm border-b border-white/5 py-3" : "bg-transparent py-5"}`}>
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/image2.png" alt="Koza Logo" width={32} height={32} className="object-contain" />
            <span className="font-headline-sm text-headline-sm tracking-tight font-bold text-white">Koza</span>
          </div>
          <Link 
            href="/auth/login" 
            className="px-5 py-2 rounded-full font-label-md text-label-md bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Masuk
          </Link>
        </div>
      </nav>

      {/* 1. The Hook (Attention) */}
      <section className="relative pt-32 pb-24 px-6 min-h-[90vh] flex items-center">
        <div className="absolute top-0 right-0 w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-[#BC0B3B]/10 rounded-full blur-[100px] md:blur-[150px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-[#006398]/20 rounded-full blur-[80px] md:blur-[120px] -z-10" />
        
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse shadow-[0_0_10px_rgba(188,11,59,0.8)]" />
            <span className="font-label-sm text-label-sm text-white/80 font-medium uppercase tracking-wider">Hanya untuk Anda yang lelah kehabisan uang</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-7xl leading-[1.1] font-extrabold tracking-tight mb-8">
            Pernahkah Anda menatap layar ATM Anda, menarik napas panjang, dan bergumam pelan... <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-error to-[#FF6B6B] block mt-4">
              "Ke mana perginya uang gajiku bulan ini?"
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl leading-relaxed">
            Gaji lumayan, gaya hidup biasa saja. Tapi entah kenapa, setiap tanggal 20 saldo sudah menipis. Jika ini terdengar seperti Anda, mohon luangkan 3 menit membaca tulisan ini. Ini bisa menyelamatkan masa depan finansial Anda.
          </p>
          
          <div className="mb-16 flex flex-col items-center">
            <Link 
              href="/auth/register"
              className="inline-block px-10 py-4 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF9900] text-[#050B14] font-extrabold text-lg uppercase tracking-wide hover:from-[#FF9900] hover:to-[#FFB800] transition-all shadow-[0_0_30px_rgba(255,122,0,0.4)] hover:shadow-[0_0_40px_rgba(255,122,0,0.6)] hover:-translate-y-1 transform duration-300 mb-4"
            >
              Coba Koza Gratis
            </Link>
            <div className="flex items-center gap-2 text-white/60 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-sm mt-2 shadow-sm backdrop-blur-md">
              <span className="material-symbols-outlined text-[18px] text-[#10B981]">lock</span>
              <span><strong>Private-by-Design.</strong> Data dikunci lokal di HP Anda, tidak disedot ke server kami.</span>
            </div>
          </div>
          
          <Link 
            href="#the-ugly-truth"
            className="group flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors"
          >
            <span className="font-label-md text-label-md uppercase tracking-widest text-xs">Atau Temukan Jawabannya</span>
            <span className="material-symbols-outlined text-[32px] animate-bounce">keyboard_arrow_down</span>
          </Link>
        </div>
      </section>

      {/* 1.5. Social Proof */}
      <section className="py-12 border-y border-white/5 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="font-label-md text-white/50 uppercase tracking-widest mb-6 text-sm">Bergabung bersama 5.420+ orang yang sudah mengamankan gajinya</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale">
            <div className="flex items-center gap-2"><span className="material-symbols-outlined">favorite</span><span className="font-bold">Dipercaya</span></div>
            <div className="flex items-center gap-2"><span className="material-symbols-outlined">security</span><span className="font-bold">Aman 100%</span></div>
            <div className="flex items-center gap-2"><span className="material-symbols-outlined">bolt</span><span className="font-bold">Super Cepat</span></div>
          </div>
        </div>
      </section>

      {/* 2. The Agitation (The Ugly Truth) */}
      <section id="the-ugly-truth" className="py-24 px-6 relative bg-gradient-to-b from-transparent to-[#131B2E]/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-white/90">Realita Pahitnya: Anda Terkena Sindrom "Bocor Halus"</h2>
          
          <div className="space-y-6 text-lg md:text-xl text-white/70 leading-relaxed font-light">
            <p>
              Anda pasti ingat cicilan motor atau tagihan listrik. Tapi tahukah Anda apa yang diam-diam "membunuh" saldo Anda?
            </p>
            <div className="bg-error/10 border-l-4 border-error p-6 my-8 rounded-r-xl">
              <ul className="text-error-container font-medium space-y-2">
                <li className="flex gap-2"><span className="text-error">•</span> Kopi susu 25 ribu</li>
                <li className="flex gap-2"><span className="text-error">•</span> Biaya admin transfer 2.500</li>
                <li className="flex gap-2"><span className="text-error">•</span> Uang parkir 2.000</li>
                <li className="flex gap-2"><span className="text-error">•</span> Jajan minimarket 18.000</li>
              </ul>
            </div>
            <p>
              Tampaknya remeh. Namun saat diakumulasikan, "bocor halus" ini bisa memakan <strong>30% hingga 40%</strong> dari total pendapatan Anda!
            </p>
            <p>
              Masalahnya: <strong>Otak manusia tidak dirancang untuk mengingat ratusan transaksi kecil.</strong> Anda mencoba mengandalkan ingatan untuk hal yang mustahil. Mencatat di buku terlalu ribet, pakai Excel terlalu kaku.
            </p>
          </div>
        </div>
      </section>

      {/* 3. The Epiphany (The Solution) */}
      <section className="py-32 px-6 relative bg-white text-surface">
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#050B14] to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Solusinya Ada Di Genggaman Anda</span>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight text-on-surface">
            Anda Butuh "Otak Kedua" Untuk Keuangan Anda.
          </h2>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto mb-16 leading-relaxed">
            Perkenalkan <strong className="text-primary">Koza</strong>. Bukan sekadar aplikasi pencatat biasa, tapi <em>asisten keuangan pribadi</em> yang bekerja tanpa ampun melacak setiap sen uang Anda.
          </p>

          <div className="relative w-full aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl mb-16 border-4 border-surface-container group">
            <div className="absolute inset-0 bg-primary/20 group-hover:opacity-0 transition-opacity z-10 duration-500" />
            <Image 
              src="/image2.png" 
              alt="Koza Dashboard" 
              fill 
              className="object-cover scale-110 group-hover:scale-100 transition-transform duration-700 blur-sm group-hover:blur-0"
            />
            <div className="absolute inset-0 flex items-center justify-center z-20 group-hover:opacity-0 transition-opacity duration-500">
              <span className="px-6 py-3 rounded-full bg-surface text-on-surface font-bold text-lg shadow-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">visibility</span>
                Lihat Koza Beraksi
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Value Stack (Features) */}
      <section className="py-24 px-6 bg-surface-container-lowest text-on-surface">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-surface hover:-translate-y-2 transition-transform duration-300 shadow-sm border border-outline-variant/30">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-[32px]">bolt</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Zero Loading Screen</h3>
              <p className="text-on-surface-variant leading-relaxed">Dibangun dengan arsitektur <em>Offline-First PWA</em>, Anda bisa mencatat transaksi seketika tanpa koneksi internet. Lebih cepat dari mengeluarkan dompet.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-surface hover:-translate-y-2 transition-transform duration-300 shadow-sm border border-outline-variant/30">
              <div className="w-14 h-14 rounded-2xl bg-[#006398]/10 flex items-center justify-center text-[#006398] mb-6">
                <span className="material-symbols-outlined text-[32px]">verified</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Garansi Saldo Akurat 100%</h3>
              <p className="text-on-surface-variant leading-relaxed">Bebas dari penyakit "saldo selisih". Berkat mesin <em>Two-Step Reversal</em> kami, ubah/hapus transaksi sesuka hati—saldo akhir pasti akurat hingga perak terakhir.</p>
            </div>

            <div className="p-8 rounded-3xl bg-surface hover:-translate-y-2 transition-transform duration-300 shadow-sm border border-outline-variant/30">
              <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center text-error mb-6">
                <span className="material-symbols-outlined text-[32px]">notifications_active</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Pengingat Agresif</h3>
              <p className="text-on-surface-variant leading-relaxed">Lupa mencatat? Koza akan mengirimkan notifikasi pengingat harian cerdas yang tidak bisa Anda abaikan. Kebiasaan baru pun terbentuk.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-surface hover:-translate-y-2 transition-transform duration-300 shadow-sm border border-outline-variant/30">
              <div className="w-14 h-14 rounded-2xl bg-[#FF9900]/10 flex items-center justify-center text-[#FF9900] mb-6">
                <span className="material-symbols-outlined text-[32px]">health_and_safety</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Skor Kesehatan Finansial</h3>
              <p className="text-on-surface-variant leading-relaxed">Koza menganalisis pola pengeluaran Anda dan memberikan nilai 0-100 secara otomatis. Anda tahu persis kapan harus mengerem.</p>
            </div>
          </div>
        </div>
      </section>
      {/* 4.2. Us vs Them */}
      <section className="py-24 px-6 bg-gradient-to-b from-surface-container-lowest to-[#050B14]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Mengapa Pengguna Beralih ke Koza?</h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">Tinggalkan aplikasi pencatat keuangan yang membuang waktu, baterai, dan mengintai data pribadi Anda.</p>
          </div>
          
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[700px] bg-white/5 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/10">
              <div className="grid grid-cols-2 divide-x divide-white/10">
                <div className="p-8 bg-error/5">
                  <h3 className="text-xl font-bold text-error mb-6 flex items-center gap-2"><span className="material-symbols-outlined">cancel</span>Aplikasi Lama Anda</h3>
                  <ul className="space-y-6">
                    <li>
                      <strong className="block text-white/90 mb-1">Ketergantungan Sinyal</strong>
                      <span className="text-white/60 text-sm">Mau catat beli kopi harus nunggu loading server.</span>
                    </li>
                    <li>
                      <strong className="block text-white/90 mb-1">Bug Saldo Bocor</strong>
                      <span className="text-white/60 text-sm">Transaksi dihapus, tapi total saldo dompet tak ikut berubah.</span>
                    </li>
                    <li>
                      <strong className="block text-white/90 mb-1">Baterai Bocor & HP Panas</strong>
                      <span className="text-white/60 text-sm">Aplikasi membengkak bawa library raksasa & iklan.</span>
                    </li>
                    <li>
                      <strong className="block text-white/90 mb-1">Data Anda Dimata-matai</strong>
                      <span className="text-white/60 text-sm">Pengeluaran dianalisis di server perusahaan asing.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-8 bg-primary/10">
                  <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2"><span className="material-symbols-outlined">check_circle</span>Bersama Koza</h3>
                  <ul className="space-y-6">
                    <li>
                      <strong className="block text-white/90 mb-1">Offline-First PWA</strong>
                      <span className="text-white/60 text-sm">Catat seketika (0-latency), walau di basement tanpa sinyal.</span>
                    </li>
                    <li>
                      <strong className="block text-white/90 mb-1">Garansi Presisi 100%</strong>
                      <span className="text-white/60 text-sm">Arsitektur canggih menjamin hitungan 100% akurat selalu.</span>
                    </li>
                    <li>
                      <strong className="block text-white/90 mb-1">Ekstra Ramping (No Bloatware)</strong>
                      <span className="text-white/60 text-sm">Murni SVG & native. Irit baterai, memori HP lega.</span>
                    </li>
                    <li>
                      <strong className="block text-white/90 mb-1">Private-by-Design</strong>
                      <span className="text-white/60 text-sm">Seluruh histori terkunci lokal di storage HP Anda sendiri.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4.5. Why Premium? (Loss Aversion & Mental Accounting) */}
      <section className="py-24 px-6 bg-[#03060A] text-white border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#10B981]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight text-white">Berhenti Membuang Uang Anda Dalam Gelap.</h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Langganan Koza Premium bukan sekadar aplikasi, ini adalah <strong className="text-white">Asisten Keuangan Pribadi</strong> yang bekerja 24/7 untuk memastikan Anda tidak pernah lagi kehabisan uang sebelum tanggal 20.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden mb-12 shadow-2xl">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
              
              {/* Without Premium (Loss) */}
              <div className="p-8 md:p-10 bg-error/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-error" />
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white/90">
                  <span className="w-10 h-10 rounded-full bg-error/20 text-error flex items-center justify-center material-symbols-outlined">close</span>
                  Tanpa Premium
                </h3>
                <ul className="space-y-6 text-white/70">
                  <li>
                    <span className="block font-bold text-white mb-1">Radar Bocor Halus</span>
                    Anda tidak sadar uang habis perlahan untuk hal sepele.
                  </li>
                  <li>
                    <span className="block font-bold text-white mb-1">Pengingat Biasa</span>
                    Mudah lupa mencatat, akhirnya catatan keuangan kembali kacau.
                  </li>
                  <li>
                    <span className="block font-bold text-white mb-1">Tanpa Batas Anggaran</span>
                    Sangat mudah tergoda checkout barang yang tidak perlu.
                  </li>
                  <li>
                    <span className="block font-bold text-white mb-1">Buta Finansial</span>
                    Hanya bisa meratapi saldo akhir yang menyedihkan tanpa tahu detailnya.
                  </li>
                </ul>
              </div>

              {/* With Premium (Gain) */}
              <div className="p-8 md:p-10 bg-[#10B981]/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]" />
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                  <span className="w-10 h-10 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center material-symbols-outlined">diamond</span>
                  Koza Premium
                </h3>
                <ul className="space-y-6 text-white/80">
                  <li>
                    <span className="block font-bold text-[#10B981] mb-1">AI Deteksi Bocor Halus</span>
                    Otomatis mendeteksi &amp; memblokir kebiasaan boros Anda sebelum terlambat.
                  </li>
                  <li>
                    <span className="block font-bold text-[#10B981] mb-1">Pengingat "Meneror"</span>
                    Asisten kami akan mengingatkan secara agresif sampai Anda disiplin.
                  </li>
                  <li>
                    <span className="block font-bold text-[#10B981] mb-1">Mode Anggaran Ketat</span>
                    Peringatan merah menyala jika Anda hampir melewati batas jajan bulanan.
                  </li>
                  <li>
                    <span className="block font-bold text-[#10B981] mb-1">Visualisasi Mendalam</span>
                    Tahu persis ke mana hilangnya setiap Rupiah dengan grafik visual ciamik.
                  </li>
                </ul>
              </div>

            </div>
          </div>

          {/* Mental Accounting Box */}
          <div className="bg-gradient-to-r from-[#FF7A00]/20 to-[#FF9900]/10 border border-[#FF7A00]/30 rounded-2xl p-8 md:p-10 text-center max-w-3xl mx-auto shadow-[0_0_40px_rgba(255,122,0,0.1)]">
            <p className="text-[#FF9900] font-bold tracking-widest uppercase text-sm mb-4">Hanya Rp 19.000 / Bulan (Lebih murah dari segelas kopi!)</p>
            <p className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-6">
              &quot;Bayangkan: Anda mengorbankan 1 gelas kopi bulan ini, untuk menyelamatkan ratusan ribu rupiah dari kebocoran tak kasat mata di bulan yang sama.&quot;
            </p>
            <p className="text-white/60 text-lg">
              Sebuah investasi cerdas yang langsung balik modal sejak hari pertama.
            </p>
          </div>
        </div>
      </section>

      {/* 5. The Irresistible Offer (Pricing) */}
      <section className="py-32 px-6 relative bg-[#050B14]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight text-white">Investasi Terkecil Untuk<br/>Perubahan Terbesar.</h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Berapa banyak uang yang bocor bulan lalu? 500 ribu? 1 juta? Menghentikan kebocoran itu jauh lebih murah dari yang Anda bayangkan.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 relative z-10">
            {/* Monthly Plan */}
            <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 hover:border-white/20 transition-colors flex flex-col">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Paket Bulanan</h3>
                <p className="text-white/50">Langkah pertama mendisiplinkan diri.</p>
              </div>
              
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-medium text-white/40 line-through">Rp 33.000</span>
                  <span className="px-3 py-1 rounded-full bg-error text-white font-bold text-xs animate-pulse shadow-[0_0_15px_rgba(188,11,59,0.5)]">Diskon 42%</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-white">19rb</span>
                  <span className="text-white/50 font-medium text-lg">/ bln</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-1 text-white/80">
                <li className="flex gap-3 items-center">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <span>Akses Semua Fitur Premium</span>
                </li>
                <li className="flex gap-3 items-center">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <span>Notifikasi Pengingat Cerdas</span>
                </li>
                <li className="flex gap-3 items-center">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <span>Ekspor Laporan (PDF/CSV)</span>
                </li>
              </ul>

              <Link 
                href="/auth/register"
                className="block w-full py-4 rounded-xl border-2 border-white/20 text-white font-bold text-center hover:bg-white/10 transition-colors"
              >
                Ambil Bulanan
              </Link>
            </div>

            {/* Yearly Plan (Best Value) */}
            <div className="bg-gradient-to-br from-[#006C49] to-[#004d34] rounded-[32px] p-8 border border-[#10B981]/50 shadow-2xl relative flex flex-col transform md:-translate-y-6">
              <div className="absolute -top-4 right-8">
                <span className="bg-[#BC0B3B] text-white px-6 py-2 rounded-full font-bold text-sm tracking-widest shadow-xl">
                  PILIHAN CERDAS
                </span>
              </div>

              <div className="mb-8 mt-2">
                <h3 className="text-2xl font-bold text-white mb-2">Paket Tahunan</h3>
                <p className="text-white/80">Untuk komitmen perubahan finansial sejati.</p>
              </div>
              
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-medium text-white/60 line-through">Rp 350.000</span>
                  <span className="px-3 py-1 rounded-full bg-[#BC0B3B] text-white font-bold text-xs shadow-[0_0_15px_rgba(188,11,59,0.5)]">Diskon 57%</span>
                </div>
                <div className="flex items-baseline gap-1 text-white">
                  <span className="text-5xl font-extrabold">149rb</span>
                  <span className="font-medium opacity-80 text-lg">/ thn</span>
                </div>
                <p className="text-sm font-medium mt-3 text-[#10B981] bg-black/20 px-3 py-1.5 rounded-lg inline-block">Setara cuma bayar parkir Rp 12.416/bulan!</p>
              </div>

              <ul className="space-y-4 mb-10 flex-1 text-white">
                <li className="flex gap-3 items-center">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span className="font-bold">Semua fitur Bulanan, PLUS:</span>
                </li>
                <li className="flex gap-3 items-center">
                  <span className="material-symbols-outlined">star</span>
                  <span>Akses prioritas fitur & update baru</span>
                </li>
                <li className="flex gap-3 items-center">
                  <span className="material-symbols-outlined">support_agent</span>
                  <span>Customer Support Jalur Khusus (VIP)</span>
                </li>
              </ul>

              <Link 
                href="/auth/register"
                className="block w-full py-4 rounded-xl bg-white text-[#006C49] font-black text-lg text-center shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95"
              >
                Klaim Diskon Tahunan Sekarang
              </Link>
              <p className="text-center text-xs text-white/70 mt-4 flex items-center justify-center gap-1 font-medium bg-black/10 py-1.5 px-3 rounded-full w-max mx-auto">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                Garansi 7 Hari Uang Kembali.
              </p>
            </div>

            {/* Lifetime Plan */}
            <div className="bg-gradient-to-br from-[#10B981] to-[#047857] rounded-[32px] p-8 border border-white/20 shadow-[0_0_50px_rgba(16,185,129,0.3)] relative flex flex-col transform md:-translate-y-2 lg:-translate-y-6">
              <div className="absolute -top-4 right-8">
                <span className="bg-[#FF9900] text-[#050B14] px-6 py-2 rounded-full font-extrabold text-sm tracking-widest shadow-xl">
                  BEST DEAL
                </span>
              </div>

              <div className="mb-8 mt-2">
                <h3 className="text-2xl font-bold text-white mb-2">Paket Lifetime</h3>
                <p className="text-white/90 font-medium">Bayar sekali, rasakan manfaatnya seumur hidup.</p>
              </div>
              
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-medium text-white/70 line-through">Rp 990.000</span>
                  <span className="px-3 py-1 rounded-full bg-[#050B14] text-white font-bold text-xs shadow-md">Diskon 80%</span>
                </div>
                <div className="flex items-baseline gap-1 text-white">
                  <span className="text-5xl font-extrabold">199rb</span>
                </div>
                <p className="text-sm font-bold mt-3 text-white bg-black/30 px-3 py-1.5 rounded-lg inline-block">Cuma beda 50rb dari tahunan!</p>
              </div>

              <ul className="space-y-4 mb-10 flex-1 text-white font-medium">
                <li className="flex gap-3 items-center">
                  <span className="material-symbols-outlined text-[#FF9900]">check_circle</span>
                  <span>Semua fitur Tahunan seumur hidup</span>
                </li>
                <li className="flex gap-3 items-center">
                  <span className="material-symbols-outlined text-[#FF9900]">star</span>
                  <span>Gratis semua update fitur masa depan</span>
                </li>
                <li className="flex gap-3 items-center">
                  <span className="material-symbols-outlined text-[#FF9900]">workspace_premium</span>
                  <span>Tidak perlu langganan bulanan lagi</span>
                </li>
              </ul>

              <Link 
                href="/auth/register"
                className="block w-full py-4 rounded-xl bg-[#050B14] text-white font-black text-lg text-center shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95 border border-white/10 hover:border-[#FF9900]"
              >
                Ambil Akses Seumur Hidup
              </Link>
              <p className="text-center text-xs text-white/80 mt-4 flex items-center justify-center gap-1 font-medium bg-black/20 py-1.5 px-3 rounded-full w-max mx-auto">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                Garansi 7 Hari Uang Kembali.
              </p>
            </div>
          </div>
          
          <div className="mt-12 flex flex-col items-center">
            <p className="text-center text-white/40 mb-4 text-sm max-w-lg mx-auto">
              Masih ragu? Anda bisa mendaftar gratis sekarang juga. Tidak ada kewajiban kartu kredit. Upgrade kapan saja saat Anda siap.
            </p>
            <Link 
              href="/auth/register"
              className="px-8 py-3 rounded-full border border-white/20 text-white font-bold hover:bg-white/10 transition-colors shadow-sm"
            >
              Coba Koza Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="py-24 px-6 relative bg-gradient-to-b from-[#050B14] to-[#02050A]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-white/50">Masih ragu? Kami punya jawabannya.</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">lock</span>
                Apakah data rekening saya aman?
              </h3>
              <p className="text-white/60 leading-relaxed">
                Sangat aman. Koza hanya mencatat nominal angka secara manual. Kami <strong>tidak pernah</strong> meminta akses atau password m-banking Anda. Data Anda sepenuhnya berada di bawah kendali Anda.
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">cancel</span>
                Apakah saya bisa membatalkan langganan kapan saja?
              </h3>
              <p className="text-white/60 leading-relaxed">
                Tentu. Tidak ada kontrak yang mengikat. Anda bisa berhenti berlangganan kapan saja langsung dari menu Pengaturan tanpa harus menghubungi Customer Service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#02050A] text-center border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-6 opacity-40">
            <Image src="/image2.png" alt="Koza Logo" width={32} height={32} className="grayscale" />
            <span className="font-bold text-xl">Koza</span>
          </div>
          <p className="text-white/40 font-body-sm text-body-sm mb-8">
            Catat pengeluaranmu sebelum pengeluaranmu mencatat hutangmu.
          </p>
          <div className="flex justify-center gap-6 font-label-sm text-label-sm text-white/50">
            <Link href="/auth/register" className="hover:text-white transition-colors">Daftar</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Masuk</Link>
            <Link href="/bantuan" className="hover:text-white transition-colors">Bantuan</Link>
          </div>
          <p className="mt-12 text-xs text-white/20 font-medium">
            © {new Date().getFullYear()} Koza Wallet. Hak Cipta Dilindungi Undang-Undang.
          </p>
        </div>
      </footer>
    </div>
  );
}
