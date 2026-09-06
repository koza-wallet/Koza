"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/supabase-auth";
import { BottomNav } from "@/components/BottomNav";
import { useFinance } from "@/lib/finance-context";
import { getTotalBalance, getWalletMonthlyNet } from "@/lib/finance";
import { formatRupiahAmount, formatSignedRupiahCompact } from "@/lib/format";

import type { Wallet, WalletType } from "@/lib/types";

const HIDDEN_BALANCE_PLACEHOLDER = "••••••••••••";

interface WalletTypeMeta {
  label: string;
  icon: string;
  bg: string;
  text: string;
}

const WALLET_TYPE_META: Record<WalletType, WalletTypeMeta> = {
  bank: { label: "Bank", icon: "account_balance", bg: "bg-secondary-fixed", text: "text-on-secondary-fixed-variant" },
  cash: { label: "Tunai", icon: "payments", bg: "bg-surface-container-high", text: "text-primary" },
  ewallet: { label: "E-Wallet", icon: "account_balance_wallet", bg: "bg-surface-variant", text: "text-secondary" },
};

function walletSubtitle(wallet: Wallet): string {
  if (wallet.type === "bank") {
    const provider = wallet.provider ? `Bank ${wallet.provider}` : "Rekening bank";
    return wallet.accountNumberMasked ? `${provider} • ${wallet.accountNumberMasked}` : provider;
  }
  if (wallet.type === "ewallet") return wallet.provider ?? wallet.name;
  return "Uang tunai fisik";
}

type FormMode = { type: "add" } | { type: "edit"; walletId: string };

export default function KelolaDompetPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { wallets, transactions, addWallet, updateWallet, deleteWallet } = useFinance();

  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<WalletType>("bank");
  const [formProvider, setFormProvider] = useState("");
  const [formAccountNumber, setFormAccountNumber] = useState("");
  const [formBalance, setFormBalance] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentDate] = useState(() => new Date());

  const totalBalance = getTotalBalance(wallets);

  function openAddForm() {
    // Logika PAYWALL: Pengguna FREE maksimal 2 Dompet
    const tier = (session?.user as any)?.subscriptionTier || "FREE";
    if (tier === "FREE" && wallets.length >= 2) {
      window.alert("🚀 Upgrade ke PRO untuk membuat lebih dari 2 dompet!");
      return;
    }

    setFormMode({ type: "add" });
    setFormName("");
    setFormType("bank");
    setFormProvider("");
    setFormAccountNumber("");
    setFormBalance(0);
    setFormError(null);
  }

  function openEditForm(wallet: Wallet) {
    setFormMode({ type: "edit", walletId: wallet.id });
    setFormName(wallet.name);
    setFormType(wallet.type);
    setFormProvider(wallet.provider ?? "");
    setFormAccountNumber(wallet.accountNumberMasked ?? "");
    setFormBalance(wallet.balance);
    setFormError(null);
  }

  function closeForm() {
    setFormMode(null);
    setFormError(null);
  }

  function handleFormSave() {
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError("Nama dompet belum diisi");
      return;
    }

    if (formMode?.type === "add") {
      addWallet({
        name: trimmedName,
        type: formType,
        provider: formProvider.trim() || undefined,
        accountNumberMasked: formAccountNumber.trim() || undefined,
        balance: formBalance,
      });
    } else if (formMode?.type === "edit") {
      updateWallet({
        id: formMode.walletId,
        name: trimmedName,
        provider: formProvider.trim() || undefined,
        accountNumberMasked: formAccountNumber.trim() || undefined,
      });
    }
    closeForm();
  }

  function handleFormDelete() {
    if (formMode?.type !== "edit") return;
    const hasHistory = transactions.some((t) => t.walletId === formMode.walletId);
    if (hasHistory) {
      setFormError("Dompet ini masih punya riwayat transaksi — tidak bisa dihapus.");
      return;
    }
    const confirmed = window.confirm("Hapus dompet ini secara permanen?");
    if (!confirmed) return;
    deleteWallet(formMode.walletId);
    closeForm();
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-screen flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Kembali"
              onClick={() => router.back()}
              className="w-11 h-11 flex items-center justify-center -ml-2 rounded-full text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Kelola Dompet</h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
        <div className="flex flex-col w-full px-margin-screen space-y-space-md">
          {/* Top Context Row */}
          <div className="flex items-center justify-between py-space-xs">
            <div>
              <span className="font-headline-sm text-headline-sm text-on-surface block">Kelola Dompet</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant block uppercase tracking-wider">
                Atur Aset Anda
              </span>
            </div>
            <div className="flex items-center gap-space-xxs">
              <button
                aria-label="Pencarian"
                type="button"
                className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>
              <button
                aria-label="Informasi Saldo"
                type="button"
                className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[20px]">info</span>
              </button>
            </div>
          </div>

          {/* Hero Summary Card */}
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-surface-container-low p-space-lg shadow-sm">
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-primary-fixed-dim/20 blur-2xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-secondary-fixed/30 blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant">Total Saldo Tergabung</span>
                  <button
                    aria-label={isBalanceHidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
                    type="button"
                    onClick={() => setIsBalanceHidden((v) => !v)}
                    className="flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isBalanceHidden ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5 px-space-xs py-1 rounded-full bg-surface-container">
                  <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                  <span className="font-label-caps text-label-caps text-on-surface-variant font-bold">
                    {wallets.length} Aktif
                  </span>
                </div>
              </div>
              <div className="flex items-baseline space-x-1">
                <h2 className="font-display-currency text-display-currency text-on-surface tracking-tight">
                  {isBalanceHidden ? HIDDEN_BALANCE_PLACEHOLDER : `Rp ${formatRupiahAmount(totalBalance)}`}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
                <div className="flex items-center gap-1 px-space-xs py-1 rounded-full bg-surface-container-low">
                  <span className="material-symbols-outlined text-primary text-[14px]">trending_up</span>
                  <span className="font-label-md text-label-md text-primary font-semibold">+2.4%</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">bln ini</span>
                </div>
                <div className="flex items-center gap-1 px-space-xs py-1 rounded-full bg-surface-container-low">
                  <span className="material-symbols-outlined text-secondary text-[14px]">verified</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Tersinkronisasi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Rebalance Tile (decorative — transfer antar dompet belum didukung) */}
          <div className="rounded-[18px] bg-surface-container-low p-space-md flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-[14px] bg-primary-fixed flex items-center justify-center text-on-primary-container shrink-0">
                <span className="material-symbols-outlined text-[22px]">swap_horiz</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-label-lg text-label-lg text-on-surface truncate">Pindahkan Saldo Antar Dompet</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  Tanpa biaya admin &amp; pencatatan otomatis
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </div>
          </div>

          {/* Wallet Section Header */}
          <div className="flex items-center justify-between pt-space-xs">
            <div className="flex items-center gap-space-xs">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Daftar Akun &amp; Dompet</h3>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-label-caps text-label-caps text-on-surface-variant">
                {wallets.length} Dompet
              </span>
            </div>
          </div>

          {/* Wallet Stack */}
          <div className="flex flex-col space-y-space-sm">
            {wallets.map((wallet) => {
              const meta = WALLET_TYPE_META[wallet.type];
              const monthly = getWalletMonthlyNet(transactions, wallet.id, currentDate);
              return (
                <div
                  key={wallet.id}
                  className="group rounded-[20px] bg-surface-container-lowest p-space-md shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-space-sm min-w-0">
                      <div
                        className={`w-12 h-12 rounded-[16px] ${meta.bg} flex items-center justify-center ${meta.text} shrink-0`}
                      >
                        <span className="material-symbols-outlined text-[26px]">{meta.icon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-space-xxs flex-wrap">
                          <h4 className="font-headline-sm text-headline-sm text-on-surface truncate">{wallet.name}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-primary-fixed font-label-caps text-label-caps text-on-primary-fixed-variant">
                            {meta.label}
                          </span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          {walletSubtitle(wallet)}
                        </span>
                        <div className="mt-space-sm">
                          <span className="font-body-sm text-body-sm text-on-surface-variant block">
                            Saldo Saat Ini
                          </span>
                          <span className="font-headline-md text-headline-md text-on-surface">
                            {isBalanceHidden ? HIDDEN_BALANCE_PLACEHOLDER : `Rp ${formatRupiahAmount(wallet.balance)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        aria-label={`Undang Anggota ke ${wallet.name}`}
                        type="button"
                        onClick={() => {
                          const email = window.prompt("Masukkan email pengguna KoZa yang ingin diundang:");
                          if (email) {
                            import("@/actions/finance").then((m) => {
                               m.addWalletMemberAction(wallet.id, email)
                                .then(() => alert("Undangan berhasil dikirim!"))
                                .catch((e) => alert(e.message));
                            });
                          }
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                      </button>
                      <button
                        aria-label={`Pengaturan Dompet ${wallet.name}`}
                        type="button"
                        onClick={() => openEditForm(wallet)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                      </button>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface-variant">
                    <span className="font-body-sm text-body-sm">Transaksi bulan ini</span>
                    <span
                      className={`font-label-md text-label-md ${monthly.net > 0 ? "text-primary" : monthly.net < 0 ? "text-tertiary" : "text-outline"}`}
                    >
                      {monthly.count > 0 ? `${formatSignedRupiahCompact(monthly.net)} (${monthly.count})` : "Belum ada"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Smart Allocation Tip Card */}
          <div className="rounded-[20px] bg-surface-container-low p-space-md flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">tips_and_updates</span>
            </div>
            <div className="min-w-0">
              <h4 className="font-label-lg text-label-lg text-on-surface">Tips Alokasi Dana</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Pisahkan dana darurat di rekening sekunder agar tidak tercampur dengan kebutuhan belanja harian.
              </p>
            </div>
          </div>

          {/* Add Wallet CTA */}
          <div className="pt-space-sm pb-space-sm">
            <button
              type="button"
              onClick={openAddForm}
              className="w-full h-14 rounded-[16px] bg-primary-container text-on-primary flex items-center justify-center gap-space-xs font-label-lg text-label-lg shadow-md hover:bg-primary active:scale-[0.99] transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">add_circle</span>
              <span>Tambah Dompet Baru</span>
            </button>
          </div>
        </div>
      </main>

      {/* Add/Edit Wallet Bottom Sheet */}
      {formMode && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <button
            aria-label="Tutup"
            onClick={closeForm}
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-t-[28px] p-space-lg pb-safe shadow-2xl space-y-space-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                {formMode.type === "add" ? "Tambah Dompet Baru" : "Edit Dompet"}
              </h3>
              <button
                aria-label="Tutup"
                type="button"
                onClick={closeForm}
                className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Type Segmented Toggle (add mode only — type is fixed once created) */}
            {formMode.type === "add" && (
              <div className="p-space-xxs bg-surface-container rounded-full flex items-center shadow-inner">
                {(["bank", "cash", "ewallet"] as WalletType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormType(type)}
                    className={
                      formType === type
                        ? "flex-1 py-space-xs px-space-sm rounded-full bg-primary-container text-on-primary shadow-sm transition-all duration-200 font-label-md text-label-md"
                        : "flex-1 py-space-xs px-space-sm rounded-full text-on-surface-variant hover:text-on-surface transition-all duration-200 font-label-md text-label-md"
                    }
                  >
                    {WALLET_TYPE_META[type].label}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-space-xs">
              <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low">
                <div className="w-9 h-9 rounded-lg bg-surface-variant text-on-surface-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <input
                  className="flex-1 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                  placeholder="Nama dompet"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              {formType !== "cash" && (
                <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low">
                  <div className="w-9 h-9 rounded-lg bg-surface-variant text-on-surface-variant flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">storefront</span>
                  </div>
                  <input
                    className="flex-1 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                    placeholder={formType === "bank" ? "Nama bank (mis. BCA)" : "Nama e-wallet (mis. GoPay)"}
                    type="text"
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value)}
                  />
                </div>
              )}
              {formType === "bank" && (
                <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low">
                  <div className="w-9 h-9 rounded-lg bg-surface-variant text-on-surface-variant flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">pin</span>
                  </div>
                  <input
                    className="flex-1 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                    placeholder="No. rekening (mis. ****1234)"
                    type="text"
                    value={formAccountNumber}
                    onChange={(e) => setFormAccountNumber(e.target.value)}
                  />
                </div>
              )}
              {formMode.type === "add" ? (
                <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low">
                  <div className="w-9 h-9 rounded-lg bg-surface-variant text-on-surface-variant flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                  </div>
                  <div className="flex items-center flex-1 gap-1">
                    <span className="font-body-md text-body-md text-outline">Rp</span>
                    <input
                      className="flex-1 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                      placeholder="0"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={formBalance > 0 ? formatRupiahAmount(formBalance) : ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        setFormBalance(digits ? Math.min(999_999_999_999, parseInt(digits, 10)) : 0);
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="font-body-sm text-body-sm text-on-surface-variant px-space-sm">
                  Saldo hanya berubah lewat transaksi, bukan lewat form ini — agar selalu presisi dengan riwayat.
                </p>
              )}
            </div>

            {formError && <p className="font-body-sm text-body-sm text-tertiary px-space-xxs">{formError}</p>}

            <button
              type="button"
              onClick={handleFormSave}
              className="w-full h-[52px] bg-primary-container hover:bg-primary text-on-primary rounded-[16px] flex items-center justify-center gap-space-xs font-label-lg text-label-lg shadow-md transition-all active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>{formMode.type === "add" ? "Simpan Dompet" : "Simpan Perubahan"}</span>
            </button>

            {formMode.type === "edit" && (
              <button
                type="button"
                onClick={handleFormDelete}
                className="w-full h-11 rounded-xl bg-error-container hover:bg-error/20 text-on-error-container flex items-center justify-center gap-1.5 font-label-lg text-label-lg transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                <span>Hapus Dompet</span>
              </button>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
