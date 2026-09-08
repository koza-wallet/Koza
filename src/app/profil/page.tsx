"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "@/lib/supabase-auth";
import { BottomNav } from "@/components/BottomNav";
import { downloadCsv, transactionsToCsv } from "@/lib/csv-export";
import { getHealthScoreLabel } from "@/lib/finance";
import { formatMonthYearId, getInitials } from "@/lib/format";
import { useFinance } from "@/lib/finance-context";
import { currentUser as mockUser } from "@/lib/mock-data";
import { getUserProfileAction, setSubscriptionTierAction, incrementExportCountAction } from "@/actions/finance";
import { updateUserAvatarAction } from "@/actions/auth";
import { savePushSubscriptionAction } from "@/actions/notifications";
import { createClient } from "@/utils/supabase/client";
import { PaywallModal } from "@/components/PaywallModal";
import { Toast, useToast } from "@/components/Toast";

export default function ProfilPage() {
  const { data: session, loading } = useSession();
  const user = session?.user;
  const { wallets, transactions, resetToDefault } = useFinance();
  const [isReminderOn, setIsReminderOn] = useState(false);
  const [dbSubscriptionTier, setDbSubscriptionTier] = useState<string | null>(null);
  const [dbUserEmail, setDbUserEmail] = useState<string>("");
  const [dbUserName, setDbUserName] = useState<string>("");
  const [exportCount, setExportCount] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast, toastVariant, showToast } = useToast();

  useEffect(() => {
    // Ambil data profil dari database (Prisma) karena metadata auth tidak sinkron real-time
    getUserProfileAction().then((data) => {
      if (data) {
        setDbSubscriptionTier(data.subscriptionTier);
        setExportCount(data.exportCount || 0);
        setIsReminderOn(data.isReminderOn);
        if (data.email) setDbUserEmail(data.email);
        if (data.name) setDbUserName(data.name);
      } else {
        setDbSubscriptionTier("FREE");
      }
    }).catch((err) => {
      console.error(err);
      setDbSubscriptionTier("FREE");
    });
  }, []);

  // Status subscription belum diketahui sampai getUserProfileAction() selesai — dipakai
  // untuk skeleton lokal di bagian badge/upsell/ekspor, bukan lagi memblokir seluruh halaman.
  const isProfileLoading = dbSubscriptionTier === null;

  // Use dbUserName if available, otherwise session user name, otherwise split email, otherwise mockUser
  const fullName = dbUserName || user?.name || (user?.email ? user.email.split("@")[0] : mockUser.fullName);
  const initials = getInitials(fullName);
  const healthLabel = getHealthScoreLabel(mockUser.healthScore);
  const memberSinceLabel = formatMonthYearId(new Date(mockUser.memberSince));
  
  const isPremiumOrDev = dbSubscriptionTier === "PREMIUM" || dbSubscriptionTier === "DEVELOPER" || dbSubscriptionTier === "PRO";

  async function handleExport() {
    if (dbSubscriptionTier === "FREE" && exportCount >= 3) {
      setIsPaywallOpen(true);
      return;
    }

    const res = await incrementExportCountAction();
    if (res?.error) {
      setIsPaywallOpen(true);
      return;
    }

    setExportCount(prev => prev + 1);
    const csv = transactionsToCsv(transactions, wallets);
    downloadCsv("koza-riwayat-transaksi.csv", csv);
  }

  async function handlePaymentSuccess() {
    try {
      await setSubscriptionTierAction("PREMIUM");
    } catch (e) {
      // ignore
    }
  }

  async function handleToggleReminder() {
    if (!isPremiumOrDev && !isReminderOn) {
      setIsPaywallOpen(true);
      return;
    }

    const nextState = !isReminderOn;
    setIsReminderOn(nextState); // Optimistic UI update

    if (nextState) {
      // Aktifkan Notifikasi
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            showToast("Izin notifikasi ditolak oleh browser.", "error");
            setIsReminderOn(false);
            return;
          }

          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          });

          await savePushSubscriptionAction(subscription, true);
        } catch (error) {
          console.error("Gagal berlangganan push notification:", error);
          showToast("Terjadi kesalahan saat mengaktifkan push notification.", "error");
          setIsReminderOn(false);
        }
      } else {
        showToast("Browser Anda tidak mendukung fitur Notifikasi Push.", "error");
        setIsReminderOn(false);
      }
    } else {
      // Matikan Notifikasi
      await savePushSubscriptionAction(null, false);
    }
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Ukuran gambar terlalu besar. Maksimal 2MB.", "error");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}-${Math.random()}.${fileExt}`;

    try {
      // 1. Upload ke Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Dapatkan URL publik
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update profil Auth Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      // 4. Update profil Prisma Database
      await updateUserAvatarAction(publicUrl);
      
      showToast("Foto profil berhasil diperbarui!");
      // window.location.reload(); // Supabase Auth listener akan otomatis memicu render ulang
    } catch (err: any) {
      console.error(err);
      showToast("Gagal mengunggah foto. Pastikan Anda telah membuat bucket 'avatars' di Supabase.", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
              onClick={() => showToast("Belum ada notifikasi baru")}
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
                Kelola preferensi dan akun KoZa Anda
              </p>
            </div>
            <Link
              href="/pengaturan"
              aria-label="Buka Pengaturan Lanjutan"
              className="w-10 h-10 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:bg-surface-container transition-all active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </Link>
          </div>

          <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04),0_2px_6px_-1px_rgba(15,23,42,0.02)] relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-fixed/30 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex items-center gap-space-md">
              <div className="relative flex-shrink-0">
                {user?.image ? (
                  <img src={user.image} alt={fullName} className="w-16 h-16 rounded-full object-cover shadow-inner" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center shadow-inner text-primary font-headline-md text-headline-md">
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  aria-label="Ubah foto profil"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {isUploading ? "hourglass_empty" : "edit"}
                  </span>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-space-xs mb-1">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">
                    {fullName}
                  </h3>
                  {isProfileLoading ? (
                    <span className="inline-block w-16 h-5 rounded-full bg-surface-container-high animate-pulse" />
                  ) : dbSubscriptionTier === "DEVELOPER" ? (
                    <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-500 px-2.5 py-0.5 rounded-full font-label-md text-label-md font-bold">
                      <span className="material-symbols-outlined text-[14px]">code</span>
                      DEVELOPER
                    </span>
                  ) : dbSubscriptionTier === "PREMIUM" || dbSubscriptionTier === "PRO" ? (
                    <span className="inline-flex items-center gap-1 bg-primary-container text-on-primary-container px-2.5 py-0.5 rounded-full font-label-md text-label-md font-bold">
                      <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                      PREMIUM
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-full font-label-md text-label-md font-semibold">
                      FREE
                    </span>
                  )}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {user?.email || mockUser.email} • Sejak {memberSinceLabel}
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
                    {healthLabel} ({mockUser.healthScore}/100)
                  </p>
                </div>
              </div>
            </div>
          </section>

          {!isProfileLoading && !isPremiumOrDev && (
            <section className="mb-space-xs -mt-1">
              <button
                onClick={() => setIsPaywallOpen(true)}
                className="w-full relative overflow-hidden bg-gradient-to-r from-primary to-primary-container p-space-md rounded-xl flex items-center justify-between shadow-md hover:shadow-lg transition-shadow group text-left"
              >
                <div className="absolute -right-4 -top-8 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none" />
                <div className="relative z-10 text-on-primary">
                  <h3 className="font-label-lg text-label-lg font-bold mb-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                    Tingkatkan ke PREMIUM
                  </h3>
                  <p className="font-body-sm text-body-sm opacity-90">
                    Buka pengingat harian & ekspor laporan tanpa batas.
                  </p>
                </div>
                <div className="relative z-10 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <span className="material-symbols-outlined text-on-primary text-[20px]">arrow_forward</span>
                </div>
              </button>
            </section>
          )}

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
              <Link className="flex items-center justify-between p-space-md hover:bg-surface-container-low transition-colors group" href="/kategori">
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">sell</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-label-lg text-label-lg text-on-surface">Kategori Transaksi</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      Atur pos Pemasukan &amp; Pengeluaran
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px] ml-space-xs">
                  chevron_right
                </span>
              </Link>
              <div className="h-[1px] bg-surface-container mx-space-md" />
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center justify-between p-space-md hover:bg-surface-container-low cursor-pointer transition-colors group w-full text-left"
              >
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">file_download</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-label-lg text-label-lg text-on-surface">Ekspor Data (.CSV)</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {isProfileLoading ? "Memuat..." : dbSubscriptionTier === "FREE" ? `Batas Ekspor Riwayat: ${Math.max(0, 3 - exportCount)}/3` : "Unduh riwayat ke Excel"}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px] ml-space-xs">
                  {!isProfileLoading && dbSubscriptionTier === "FREE" && exportCount >= 3 ? "lock" : "download"}
                </span>
              </button>
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
                  onClick={handleToggleReminder}
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

              <Link className="flex items-center justify-between p-space-md hover:bg-surface-container-low transition-colors group" href="/bantuan">
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
              </Link>
            </div>
          </section>

          <div className="pt-space-xs space-y-space-md">
            <p className="text-center font-label-caps text-label-caps text-on-surface-variant tracking-wider">
              Versi Aplikasi 2.4.1 • Dompetku Studio
            </p>
          </div>
        </div>
      </main>

      <PaywallModal 
        isOpen={isPaywallOpen} 
        onClose={() => setIsPaywallOpen(false)} 
        onSuccess={async () => {
          await handlePaymentSuccess();
          setIsPaywallOpen(false);
          showToast("Pembayaran Berhasil! Silakan muat ulang halaman untuk melihat status PREMIUM Anda.");
        }}
      />

      <Toast message={toast} variant={toastVariant} />

      <BottomNav />
    </>
  );
}
