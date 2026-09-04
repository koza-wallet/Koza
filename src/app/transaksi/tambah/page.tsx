"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORY_OPTIONS, DEFAULT_CATEGORY_ID, getCategoryById } from "@/lib/categories";
import { useFinance } from "@/lib/finance-context";
import { getWalletDisplayLabel } from "@/lib/finance";
import {
  combineDateWithTimeOfDay,
  formatRupiahAmount,
  formatTransactionDateLabel,
  toDateInputValue,
} from "@/lib/format";
import { REFERENCE_DATE } from "@/lib/mock-data";
import type { TransactionDirection } from "@/lib/types";

const QUICK_AMOUNTS = [
  { label: "+25rb", value: 25_000 },
  { label: "+50rb", value: 50_000 },
  { label: "+100rb", value: 100_000 },
];

export default function CatatTransaksiPage() {
  const router = useRouter();
  const { wallets, addTransaction } = useFinance();

  const [direction, setDirection] = useState<TransactionDirection>("expense");
  const [rawAmount, setRawAmount] = useState(0);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState(DEFAULT_CATEGORY_ID);
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState(REFERENCE_DATE);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");

  const isExpense = direction === "expense";

  function addAmount(value: number) {
    setRawAmount((v) => v + value);
    setAmountError(null);
  }

  function resetAmount() {
    setRawAmount(0);
  }

  function focusAmount() {
    // Ported from the Stitch export's own focusAmount(): a native prompt for
    // manual entry, not a custom-styled input the design never specified.
    const input = window.prompt("Masukkan jumlah nominal (Rp):", rawAmount ? String(rawAmount) : "");
    if (input === null) return;
    const parsed = parseInt(input.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsed)) {
      setRawAmount(parsed);
      setAmountError(null);
    }
  }

  function handleSave() {
    if (rawAmount <= 0) {
      setAmountError("Nominal transaksi belum diisi");
      return;
    }
    if (!walletId) {
      setAmountError("Pilih dompet sumber terlebih dahulu");
      return;
    }

    setStatus("saving");
    window.setTimeout(() => {
      const category = getCategoryById(categoryId);
      addTransaction({
        title: note.trim() || category.fullName,
        category: category.fullName,
        categoryIcon: category.icon,
        direction,
        amount: rawAmount,
        walletId,
        timestamp: combineDateWithTimeOfDay(selectedDate, REFERENCE_DATE),
      });
      setStatus("success");
      window.setTimeout(() => router.push("/"), 900);
    }, 500);
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
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Catat Transaksi</h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 bg-surface">
        <div className="flex flex-col w-full pb-safe">
          {/* Segmented Tabs: Duit Keluar vs Duit Masuk */}
          <div className="px-margin-screen pt-space-sm pb-space-xs">
            <div className="p-space-xxs bg-surface-container rounded-full flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => setDirection("expense")}
                className={
                  isExpense
                    ? "flex-1 py-space-xs px-space-md rounded-full flex items-center justify-center gap-space-xs bg-tertiary text-on-tertiary shadow-sm transition-all duration-200"
                    : "flex-1 py-space-xs px-space-md rounded-full flex items-center justify-center gap-space-xs text-on-surface-variant hover:text-on-surface transition-all duration-200"
                }
              >
                <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                <span className="font-label-lg text-label-lg">Duit Keluar</span>
              </button>
              <button
                type="button"
                onClick={() => setDirection("income")}
                className={
                  !isExpense
                    ? "flex-1 py-space-xs px-space-md rounded-full flex items-center justify-center gap-space-xs bg-primary-container text-on-primary shadow-sm transition-all duration-200"
                    : "flex-1 py-space-xs px-space-md rounded-full flex items-center justify-center gap-space-xs text-on-surface-variant hover:text-on-surface transition-all duration-200"
                }
              >
                <span className="material-symbols-outlined text-[18px] text-primary">arrow_upward</span>
                <span className="font-label-lg text-label-lg">Duit Masuk</span>
              </button>
            </div>
          </div>

          {/* Hero Amount Display with Interactive Numerical State */}
          <div className="px-margin-screen py-space-md flex flex-col items-center justify-center">
            <span
              className={
                isExpense
                  ? "font-label-md text-label-md uppercase tracking-wider text-tertiary bg-tertiary-fixed px-space-sm py-space-xxs rounded-full mb-space-xs flex items-center gap-1"
                  : "font-label-md text-label-md uppercase tracking-wider text-primary bg-primary-fixed px-space-sm py-space-xxs rounded-full mb-space-xs flex items-center gap-1"
              }
            >
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isExpense ? "bg-tertiary" : "bg-primary"}`} />
              {isExpense ? "Nominal Pengeluaran" : "Nominal Pemasukan"}
            </span>
            <div
              className="flex items-baseline justify-center gap-space-xs cursor-text select-none group"
              onClick={focusAmount}
            >
              <span className="font-headline-md text-headline-md text-outline font-bold">Rp</span>
              <span className="font-display-currency text-display-currency text-on-background tracking-tight">
                {formatRupiahAmount(rawAmount)}
              </span>
              <span className="w-0.5 h-8 bg-primary rounded-full animate-pulse ml-0.5" />
            </div>
            {amountError ? (
              <span className="font-body-sm text-body-sm text-tertiary mt-space-xxs">{amountError}</span>
            ) : (
              <span className="font-body-sm text-body-sm text-outline mt-space-xxs">
                Ketik jumlah transaksi atau pilih preset
              </span>
            )}
            {/* Quick Amount Chips */}
            <div className="flex items-center gap-space-xs mt-space-sm overflow-x-auto w-full justify-center">
              {QUICK_AMOUNTS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => addAmount(preset.value)}
                  className="px-space-sm py-space-xxs bg-surface-container-low hover:bg-surface-container-high rounded-full font-label-md text-label-md text-on-surface-variant transition-colors shadow-sm"
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={resetAmount}
                className="px-space-sm py-space-xxs bg-error-container hover:bg-error text-on-error-container hover:text-on-error rounded-full font-label-md text-label-md transition-colors flex items-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-[14px]">backspace</span> Reset
              </button>
            </div>
          </div>

          {/* Category Grid Section */}
          <div className="px-margin-screen mt-space-xs">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-lg text-label-lg text-on-surface">Pilih Kategori</span>
              <span className="font-label-md text-label-md text-primary font-bold">
                {CATEGORY_OPTIONS.length} Kategori
              </span>
            </div>
            <div className="grid grid-cols-4 gap-space-xs">
              {CATEGORY_OPTIONS.map((category) => {
                const selected = category.id === categoryId;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className={`category-btn flex flex-col items-center justify-center p-space-xs rounded-xl text-on-surface transition-all duration-200 ${
                      selected ? "bg-surface-container-high shadow-sm" : "bg-surface-container-low hover:bg-surface-container"
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl ${category.bg} ${category.text} flex items-center justify-center mb-space-xxs${
                        category.iconShadow ? " shadow-sm" : ""
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">{category.icon}</span>
                    </div>
                    <span className="font-label-md text-label-md text-center line-clamp-1">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transaction Details Card & Input Form */}
          <div className="px-margin-screen mt-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm space-y-space-xs">
              {/* Date Picker Row */}
              <div className="relative">
                <div className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low text-left">
                  <div className="flex items-center gap-space-xs min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-caps text-label-caps text-outline uppercase">Tanggal Transaksi</span>
                      <span className="font-label-lg text-label-lg text-on-surface truncate">
                        {formatTransactionDateLabel(selectedDate, REFERENCE_DATE)}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[20px]">expand_more</span>
                </div>
                <input
                  type="date"
                  aria-label="Pilih tanggal transaksi"
                  value={toDateInputValue(selectedDate)}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(new Date(`${e.target.value}T00:00:00`));
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              {/* Wallet Selector Row */}
              <div className="relative">
                <div className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low text-left">
                  <div className="flex items-center gap-space-xs min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-caps text-label-caps text-outline uppercase">Sumber Rekening</span>
                      <span className="font-label-lg text-label-lg text-on-surface truncate">
                        {wallets.find((w) => w.id === walletId)
                          ? getWalletDisplayLabel(wallets.find((w) => w.id === walletId)!)
                          : "Pilih dompet"}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
                </div>
                <select
                  aria-label="Pilih dompet sumber"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {getWalletDisplayLabel(wallet)}
                    </option>
                  ))}
                </select>
              </div>
              {/* Note Input Row */}
              <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low">
                <div className="w-9 h-9 rounded-lg bg-surface-variant text-on-surface-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                </div>
                <input
                  className="flex-1 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                  placeholder="Catatan (opsional)"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Micro Visual Inspiration Banner */}
          <div className="px-margin-screen mt-space-sm mb-space-xs">
            <div className="flex items-center gap-space-sm p-space-sm rounded-xl bg-surface-container-low shadow-sm">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-full h-full object-cover"
                  alt=""
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJiWILmHG34Fgrt2rCfcaLmJgn3sbsop3dLJjVTjZz3v3D8vPtSvOfg04qkYDUT8uaRzzQCO2uVxFTm-PG5pYiGYCl6R4TZ2z3ExOgkFYH7x2IGxLTkU4DBpAdgROjmP2xsqYnhXyylw8TrnjXaCxgnPasfdvwMVohtiLDe-EpyVijzNz3ph7S93Kz9Vq3h4C3DsMiTNwaTfshuos0u5bZwhSYmyEEIKhHUChStlKe-JfkLeaqEoHd"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-label-md text-label-md text-on-surface truncate">Tips Finansial Hari Ini</p>
                <p className="font-body-sm text-body-sm text-outline line-clamp-1">
                  Mencatat segera mencegah boncos di akhir bulan!
                </p>
              </div>
              <span className="material-symbols-outlined text-primary-container text-[20px]">auto_awesome</span>
            </div>
          </div>

          {/* Bottom Prominent Floating Action Button */}
          <div className="px-margin-screen pt-space-xs pb-space-lg mt-auto">
            <button
              type="button"
              disabled={status !== "idle"}
              onClick={handleSave}
              className="w-full h-[52px] bg-primary-container hover:bg-primary text-on-primary rounded-[16px] flex items-center justify-center gap-space-xs font-label-lg text-label-lg shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-80 disabled:pointer-events-none"
            >
              {status === "idle" && (
                <>
                  <span className="material-symbols-outlined text-[22px]">check_circle</span>
                  <span>Simpan Transaksi</span>
                </>
              )}
              {status === "saving" && (
                <>
                  <span className="material-symbols-outlined animate-spin text-[22px]">sync</span>
                  <span>Menyimpan...</span>
                </>
              )}
              {status === "success" && (
                <>
                  <span className="material-symbols-outlined text-[22px]">done_all</span>
                  <span>Tersimpan Rapi!</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
