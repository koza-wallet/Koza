"use client";

import Link from "next/link";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { getHealthScoreLabel } from "@/lib/finance";
import { formatMonthYearId, getInitials } from "@/lib/format";
import { useFinance } from "@/lib/finance-context";
import { currentUser } from "@/lib/mock-data";

export default function ProfilPage() {
  const { wallets, resetToDefault } = useFinance();
  const [isReminderOn, setIsReminderOn] = useState(true);

  const initials = getInitials(currentUser.fullName);
  const healthLabel = getHealthScoreLabel(currentUser.healthScore);
  const memberSinceLabel = formatMonthYearId(new Date(currentUser.memberSince));

  function handleResetToDefault() {
    const confirmed = window.confirm(
      "Reset semua saldo dompet & riwayat transaksi ke data awal (dummy)? Perubahan yang sudah Anda catat akan hilang dan tidak bisa dikembalikan."
    );
    if (confirmed) resetToDefault();
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-screen flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Profil</h1>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Notifikasi"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
        <div className="flex flex-col w-full px-margin-screen space-y-space-xl">
          <div className="flex items-center justify-between pt-space-xs">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Profil &amp; Pengaturan</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Kelola preferensi dan akun Dompetku Anda
              </p>
            </div>
            <button
              aria-label="Buka Pengaturan Lanjutan"
              className="w-10 h-10 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:bg-surface-container transition-all active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
          </div>

          <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04),0_2px_6px_-1px_rgba(15,23,42,0.02)] relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-fixed/30 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex items-center gap-space-md">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center shadow-inner text-primary font-headline-md text-headline-md">
                  {initials}
                </div>
                <button
                  aria-label="Ubah foto profil"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-space-xs mb-1">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">
                    {currentUser.fullName}
                  </h3>
                  <span className="inline-flex items-center gap-1 bg-surface-container-low text-primary px-2.5 py-0.5 rounded-full font-label-md text-label-md font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                    Personal Free
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {currentUser.email} • Sejak {memberSinceLabel}
                </p>
              </div>
            </div>
            <div className="mt-space-lg pt-space-md grid grid-cols-2 gap-space-xs bg-surface-container-low rounded-lg p-space-sm">
              <div className="flex items-center gap-space-xs">
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary flex-shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                </div>
                <div className="min-w-0">
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Dompet</p>
                  <p className="font-label-lg text-label-lg text-on-surface truncate">
                    {wallets.length} Terhubung
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-space-xs pl-space-xs">
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary-container flex-shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </div>
                <div className="min-w-0">
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Skor Finansial</p>
                  <p className="font-label-lg text-label-lg text-primary truncate">
                    {healthLabel} ({currentUser.healthScore}/100)
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-space-xs">
            <div className="flex items-center justify-between px-space-xxs">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                Kelola Keuangan
              </span>
              <span className="font-label-md text-label-md text-primary">Atur</span>
            </div>
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]">
              <Link className="flex items-center justify-between p-space-md hover:bg-surface-container-low transition-colors group" href="/dompet">
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">account_balance</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-label-lg text-label-lg text-on-surface">Daftar Dompet Manual</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      Kelola saldo tunai &amp; rekening bank
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px] ml-space-xs">
                  chevron_right
                </span>
              </Link>
              <div className="h-[1px] bg-surface-container mx-space-md" />
              <a className="flex items-center justify-between p-space-md hover:bg-surface-container-low transition-colors group" href="#">
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">sell</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-label-lg text-label-lg text-on-surface">Kategori Transaksi</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      Atur pos Duit Masuk &amp; Duit Keluar
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px] ml-space-xs">
                  chevron_right
                </span>
              </a>
              <div className="h-[1px] bg-surface-container mx-space-md" />
              <a className="flex items-center justify-between p-space-md hover:bg-surface-container-low transition-colors group" href="#">
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface-container text-on-surface flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">file_download</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-space-xs">
                      <h4 className="font-label-lg text-label-lg text-on-surface">Ekspor Laporan</h4>
                      <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-caps text-label-caps px-2 py-0.5 rounded-full">
                        Baru
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      Unduh pembukuan berkala CSV / PDF
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px] ml-space-xs">
                  chevron_right
                </span>
              </a>
            </div>
          </section>

          <section className="space-y-space-xs">
            <div className="px-space-xxs">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                Preferensi &amp; Sistem
              </span>
            </div>
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between p-space-md">
                <div className="flex items-center gap-space-md min-w-0 mr-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">alarm</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-label-lg text-label-lg text-on-surface">Pengingat Harian</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                      Rutinitas catat jam 20:00
                    </p>
                  </div>
                </div>
                <button
                  aria-checked={isReminderOn}
                  aria-label="Pengingat Harian"
                  role="switch"
                  onClick={() => setIsReminderOn((v) => !v)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                    isReminderOn ? "bg-primary-container" : "bg-surface-variant"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-on-primary shadow-md transition duration-200 ease-in-out ${
                      isReminderOn ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <div className="h-[1px] bg-surface-container mx-space-md" />
              <a className="flex items-center justify-between p-space-md hover:bg-surface-container-low transition-colors group" href="#">
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low text-on-surface-variant flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-label-lg text-label-lg text-on-surface">Keamanan &amp; PIN</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      Kunci aplikasi &amp; biometrik sidik jari
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px] ml-space-xs">
                  chevron_right
                </span>
              </a>
              <div className="h-[1px] bg-surface-container mx-space-md" />
              <a className="flex items-center justify-between p-space-md hover:bg-surface-container-low transition-colors group" href="#">
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low text-on-surface-variant flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">help_outline</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-label-lg text-label-lg text-on-surface">Bantuan &amp; Dukungan</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      FAQ dan kontak layanan nasabah
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px] ml-space-xs">
                  chevron_right
                </span>
              </a>
            </div>
          </section>

          <div className="pt-space-xs space-y-space-md">
            <button
              type="button"
              className="w-full bg-error-container text-on-error-container hover:bg-error/20 font-label-lg text-label-lg py-3.5 px-space-md rounded-xl flex items-center justify-center gap-space-xs transition-all active:scale-[0.99] shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Keluar dari Akun</span>
            </button>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="w-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container font-label-lg text-label-lg py-3.5 px-space-md rounded-xl flex items-center justify-center gap-space-xs transition-all active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[20px]">restart_alt</span>
              <span>Reset ke Data Awal</span>
            </button>
            <p className="text-center font-label-caps text-label-caps text-on-surface-variant tracking-wider">
              Versi Aplikasi 2.4.1 • Dompetku Studio
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  );
}
