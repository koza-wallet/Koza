"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getUserProfileAction, setSubscriptionTierAction } from "@/actions/finance";
import { useSession, signOut } from "@/lib/supabase-auth";
import { useFinance } from "@/lib/finance-context";

export default function PengaturanPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [darkMode, setDarkMode] = useState(true);
  const [dbUserEmail, setDbUserEmail] = useState("");
  const [dbTier, setDbTier] = useState("FREE");
  
  const { resetToDefault } = useFinance();

  function handleResetToDefault() {
    const confirmed = window.confirm(
      "Reset semua saldo dompet & riwayat transaksi ke data awal (dummy)? Perubahan yang sudah Anda catat akan hilang dan tidak bisa dikembalikan."
    );
    if (confirmed) resetToDefault();
  }

  // Set email dari session client-side segera (tidak butuh server action)
  useEffect(() => {
    const emailFromSession = session?.user?.email;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (emailFromSession) setDbUserEmail(emailFromSession);
  }, [session]);

  // Sync mode gelap + fetch tier dari server
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDarkMode(isDark);

    getUserProfileAction().then((data) => {
      if (data) {
        if (data.email) setDbUserEmail(data.email);
        setDbTier(data.subscriptionTier);
      }
    }).catch(() => {});
  }, []);

  const handleDevTierChange = async (tier: string) => {
    try {
      const res = await setSubscriptionTierAction(tier);
      if (res?.error) {
        alert(`Gagal mengubah tier:\n${res.error}`);
        return;
      }
      setDbTier(tier);
      alert(`Tier berhasil diubah ke ${tier}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Gagal memanggil fungsi:\n${msg}`);
    }
  };

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleComingSoon = () => {
    alert("Fitur ini sedang dalam tahap pengembangan (Segera Hadir).");
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm("Apakah Anda yakin ingin menghapus akun Anda beserta semua data transaksi? Tindakan ini tidak dapat dibatalkan.");
    if (confirmed) {
      alert("Permintaan penghapusan akun telah dikirim ke admin.");
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-screen flex items-center gap-space-md">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Pengaturan</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full pt-20 pb-28 px-margin-screen space-y-space-lg bg-surface">
        
        {/* Tampilan & Aksesibilitas */}
        <section className="space-y-space-xs">
          <h2 className="font-label-caps text-label-caps text-primary uppercase tracking-wider pl-space-xxs">
            Tampilan &amp; Aksesibilitas
          </h2>
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
            <div className="flex items-center justify-between p-space-md">
              <div className="flex items-center gap-space-md">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">{darkMode ? "dark_mode" : "light_mode"}</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface">Mode Gelap</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Kurangi silau pada mata</p>
                </div>
              </div>
              <button
                role="switch"
                aria-checked={darkMode}
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out ${darkMode ? "bg-primary" : "bg-surface-variant"}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-surface shadow-md transition duration-200 ease-in-out ${darkMode ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            
            <div className="h-[1px] bg-surface-container mx-space-md" />
            
            <button onClick={handleComingSoon} className="w-full flex items-center justify-between p-space-md hover:bg-surface-container-low cursor-pointer transition-colors text-left">
              <div className="flex items-center gap-space-md">
                <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">language</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface">Bahasa</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Indonesia (ID)</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </button>
          </div>
        </section>

        {/* Keuangan */}
        <section className="space-y-space-xs">
          <h2 className="font-label-caps text-label-caps text-primary uppercase tracking-wider pl-space-xxs">
            Keuangan
          </h2>
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
            <button onClick={handleComingSoon} className="w-full flex items-center justify-between p-space-md hover:bg-surface-container-low cursor-pointer transition-colors text-left">
              <div className="flex items-center gap-space-md">
                <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface">Mata Uang Utama</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Rupiah (IDR)</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </button>
          </div>
        </section>

        {/* Akun & Keamanan */}
        <section className="space-y-space-xs">
          <h2 className="font-label-caps text-label-caps text-error uppercase tracking-wider pl-space-xxs">
            Akun &amp; Keamanan
          </h2>
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
            <Link href="/auth/reset-password" className="flex items-center justify-between p-space-md hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-space-md">
                <div className="w-10 h-10 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">key</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface">Ubah Kata Sandi</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Ganti kata sandi akun Anda</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </Link>
            
            <div className="h-[1px] bg-surface-container mx-space-md" />
            
            <button onClick={handleDeleteAccount} className="w-full flex items-center justify-between p-space-md hover:bg-error-container/20 cursor-pointer transition-colors group text-left">
              <div className="flex items-center gap-space-md">
                <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-error">Hapus Akun</h4>
                  <p className="font-body-sm text-body-sm text-error/80">Hapus permanen semua data Anda</p>
                </div>
              </div>
            </button>
            
            <div className="h-[1px] bg-surface-container mx-space-md" />
            
            <button onClick={() => signOut()} className="w-full flex items-center justify-between p-space-md hover:bg-error-container/20 cursor-pointer transition-colors group text-left">
              <div className="flex items-center gap-space-md">
                <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-error">Keluar Akun</h4>
                  <p className="font-body-sm text-body-sm text-error/80">Keluar dari sesi Anda saat ini</p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Data & Preferensi */}
        <section className="space-y-space-xs mt-8">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider pl-space-xxs">
            Data Aplikasi
          </h2>
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
            <button onClick={handleResetToDefault} className="w-full flex items-center justify-between p-space-md hover:bg-surface-container-low cursor-pointer transition-colors group text-left">
              <div className="flex items-center gap-space-md">
                <div className="w-10 h-10 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface">Reset ke Data Awal</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Kembalikan ke saldo dummy awal</p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Developer Menu (Khusus Novriekadito) */}
        {(dbUserEmail === "novriekadito9@gmail.com" || dbUserEmail === "novriekadito@gmail.com") && (
          <section className="space-y-space-xs mt-8">
            <h2 className="font-label-caps text-label-caps text-amber-500 uppercase tracking-wider pl-space-xxs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">code</span>
              Developer Tools
            </h2>
            <div className="bg-amber-500/10 rounded-xl shadow-sm border border-amber-500/30 p-space-md">
              <p className="font-body-sm text-body-sm text-amber-600 dark:text-amber-400 mb-4">
                Pilih status langganan untuk melakukan pengetesan UI Paywall & Fitur Premium.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleDevTierChange("FREE")}
                  className={`p-2 rounded-lg font-label-md text-label-md border-2 transition-all ${
                    dbTier === "FREE" ? "border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300" : "border-transparent bg-surface text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  FREE
                </button>
                <button
                  onClick={() => handleDevTierChange("PREMIUM")}
                  className={`p-2 rounded-lg font-label-md text-label-md border-2 transition-all ${
                    dbTier === "PREMIUM" ? "border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300" : "border-transparent bg-surface text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  PREMIUM
                </button>
                <button
                  onClick={() => handleDevTierChange("DEVELOPER")}
                  className={`p-2 rounded-lg font-label-md text-label-md border-2 transition-all ${
                    dbTier === "DEVELOPER" ? "border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300" : "border-transparent bg-surface text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  DEVELOPER
                </button>
              </div>
            </div>
          </section>
        )}

      </main>
    </>
  );
}
