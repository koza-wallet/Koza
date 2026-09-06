"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import {
  DEFAULT_EXPENSE_CATEGORY_ID,
  DEFAULT_INCOME_CATEGORY_ID,
  getCategoriesForDirection,
  getCategoryById,
} from "@/lib/categories";
import { useFinance } from "@/lib/finance-context";
import { getWalletDisplayLabel } from "@/lib/finance";
import {
  combineDateWithTimeOfDay,
  formatRupiahAmount,
  formatTerbilang,
  formatTransactionDateLabel,
  toDateInputValue,
} from "@/lib/format";
import type { TransactionDirection } from "@/lib/types";


/** `useSearchParams()` (for the `?id=` edit-mode param) requires a Suspense boundary in the App Router — this wrapper adds one without changing anything visual. */
export default function CatatTransaksiPage() {
  return (
    <Suspense fallback={null}>
      <CatatTransaksiForm />
    </Suspense>
  );
}

function CatatTransaksiForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const { wallets, customCategories, transactions, addTransaction, updateTransaction, addDebt } = useFinance();
  const editingTransaction = editId ? transactions.find(t => t.id === editId) : undefined;
  const isEditing = !!editingTransaction;
  
  const [tab, setTab] = useState<"expense" | "income" | "debt">("expense");
  const [direction, setDirection] = useState<TransactionDirection>("expense");
  const [debtType, setDebtType] = useState<"HUTANG" | "PIUTANG">("HUTANG");
  const [contactName, setContactName] = useState("");
  
  const [rawAmount, setRawAmount] = useState(0);
  const [amountError, setAmountError] = useState<string | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [categoryId, setCategoryId] = useState(DEFAULT_EXPENSE_CATEGORY_ID);
  // walletId: inisialisasi dan jaga selalu valid —
  // wallets bisa berubah setelah HYDRATE dari localStorage,
  // sehingga kita pakai useMemo untuk mendapatkan fallback terkini.
  const defaultWalletId = useMemo(() => wallets[0]?.id ?? "", [wallets]);
  const [walletId, setWalletId] = useState("");
  // Derived: jika walletId kosong atau walletnya sudah dihapus, pakai default
  const resolvedWalletId = wallets.some((w) => w.id === walletId) ? walletId : defaultWalletId;
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [note, setNote] = useState("");
  const [currencyCode, setCurrencyCode] = useState("IDR");
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");
  // Tracks which transaction id the form fields were last prefilled from —
  // React's own recommended "adjust state during render" pattern (not an
  // effect) for syncing local form state to an external value. On a hard
  // reload of `?id=...`, `transactions` starts out as the default dataset for
  // one tick until FinanceContext's own localStorage hydration lands; this
  // re-runs once that lands and `editingTransaction` actually resolves, so
  // the form never prefills from stale data.
  const [prefilledForId, setPrefilledForId] = useState<string | null>(null);

  const isExpense = direction === "expense";
  const applicableCategories = useMemo(() => {
    const base = getCategoriesForDirection(tab === "income" ? "income" : "expense");
    const custom = customCategories.filter(c => c.type === (tab === "income" ? "income" : "expense") || c.type === "both");
    const all = [...base, ...custom];
    
    // Pastikan "Lainnya" selalu berada di akhir
    const lainnyaIndex = all.findIndex(c => c.id === "lainnya");
    if (lainnyaIndex !== -1) {
      const lainnya = all.splice(lainnyaIndex, 1)[0];
      all.push(lainnya);
    }
    
    return all;
  }, [tab, customCategories]);

  if (editingTransaction && prefilledForId !== editingTransaction.id) {
    setPrefilledForId(editingTransaction.id);
    setDirection(editingTransaction.direction);
    setRawAmount(editingTransaction.amount);
    setCategoryId(editingTransaction.categoryId);
    setWalletId(editingTransaction.walletId ?? defaultWalletId);
    setSelectedDate(new Date(editingTransaction.timestamp));
    setNote(editingTransaction.note ?? "");
  }

  function handleTabChange(next: "expense" | "income" | "debt") {
    setTab(next);
    if (next === "expense" || next === "income") {
      setDirection(next);
      const stillApplies = getCategoriesForDirection(next).some((c) => c.id === categoryId);
      if (!stillApplies) {
        setCategoryId(next === "expense" ? DEFAULT_EXPENSE_CATEGORY_ID : DEFAULT_INCOME_CATEGORY_ID);
      }
    }
  }

  function handleDirectionChange(next: TransactionDirection) {
    setDirection(next);
    // Reset the category if the current pick doesn't apply to the new
    // direction (e.g. "Makan" isn't offered under Duit Masuk).
    const stillApplies = getCategoriesForDirection(next).some((c) => c.id === categoryId);
    if (!stillApplies) {
      setCategoryId(next === "expense" ? DEFAULT_EXPENSE_CATEGORY_ID : DEFAULT_INCOME_CATEGORY_ID);
    }
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Strip semua non-digit (termasuk titik separator ribuan yang diformat oleh formatRupiahAmount)
    const digitsOnly = e.target.value.replace(/\D/g, "");
    if (!digitsOnly) {
      setRawAmount(0);
      setAmountError(null);
      return;
    }
    const parsed = parseInt(digitsOnly, 10);
    // Guard overflow
    if (!isNaN(parsed) && parsed <= 999_999_999_999) {
      setRawAmount(parsed);
      setAmountError(null);
    }
  }


  function handleSave() {
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      setAmountError("Nominal transaksi belum diisi");
      return;
    }
    if (!resolvedWalletId) {
      setAmountError("Pilih dompet sumber terlebih dahulu");
      return;
    }
    
    if (tab === "debt" && !contactName.trim()) {
      setAmountError("Nama kontak wajib diisi untuk pencatatan hutang/piutang baru");
      return;
    }

    if (tab === "expense" || (tab === "debt" && debtType === "PIUTANG")) {
      const selectedWallet = wallets.find((w) => w.id === resolvedWalletId);
      const restoredAmount =
        editingTransaction && editingTransaction.walletId === walletId && editingTransaction.direction === "expense"
          ? editingTransaction.amount
          : 0;
      const availableBalance = (selectedWallet?.balance ?? 0) + restoredAmount;

      if (rawAmount > availableBalance) {
        setAmountError(
          `Saldo ${selectedWallet?.name ?? "dompet ini"} tidak cukup — tersedia Rp ${formatRupiahAmount(availableBalance)}`
        );
        return;
      }
    }

    setStatus("saving");
    window.setTimeout(async () => {
      try {
        if (tab === "debt") {
          const dt = combineDateWithTimeOfDay(selectedDate, new Date());
          await addDebt({
            type: debtType,
            contactName: contactName.trim(),
            amount: rawAmount,
            walletId: resolvedWalletId,
            date: dt,
          });
        } else {
          let category = getCategoryById(categoryId);
          // Fallback untuk kategori kustom jika tidak ketemu di base categories
          if (category.id !== categoryId) {
            const customMatch = customCategories.find(c => c.id === categoryId);
            if (customMatch) {
              category = customMatch as any;
            }
          }

          const trimmedNote = note.trim();
          const payload = {
            title: trimmedNote || category.fullName,
            categoryId: category.id,
            category: category.fullName,
            categoryIcon: category.icon,
            direction,
            amount: Math.round(rawAmount * exchangeRate),
            walletId: resolvedWalletId,
            note: trimmedNote || undefined,
            timestamp: combineDateWithTimeOfDay(selectedDate, new Date()),
            currencyCode,
            exchangeRate
          };

          if (editingTransaction) {
            updateTransaction({ id: editingTransaction.id, ...payload });
          } else {
            addTransaction(payload);
          }
        }

        setStatus("success");
        window.setTimeout(() => {
          router.push(editingTransaction ? `/transaksi/${editingTransaction.id}` : "/");
        }, 900);
      } catch (error) {
        setAmountError("Terjadi kesalahan saat menyimpan data.");
        setStatus("idle");
      }
    }, 500);
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 pt-safe bg-surface/85 backdrop-blur-xl border-b border-outline-variant/10 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-lg mx-auto h-16 px-margin-screen flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Kembali"
              onClick={() => router.back()}
              className="w-11 h-11 flex items-center justify-center -ml-2 rounded-full text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              {isEditing ? "Edit Transaksi" : "Catat Transaksi"}
            </h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full max-w-lg mx-auto pt-16 pb-28 bg-surface min-h-screen">
        <div className="flex flex-col w-full pb-safe">
          {/* Segmented Tabs: Pengeluaran vs Pemasukan vs Hutang */}
          <div className="px-margin-screen pt-space-sm pb-space-xs overflow-x-auto no-scrollbar">
            <div className="min-w-fit p-space-xxs bg-surface-container rounded-full flex items-center shadow-inner gap-1">
              <button
                type="button"
                onClick={() => handleTabChange("expense")}
                className={
                  tab === "expense"
                    ? "px-4 py-2 rounded-full flex items-center justify-center gap-space-xs bg-tertiary text-on-tertiary shadow-sm transition-all duration-200 shrink-0"
                    : "px-4 py-2 rounded-full flex items-center justify-center gap-space-xs text-on-surface-variant hover:text-on-surface transition-all duration-200 shrink-0"
                }
              >
                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                <span className="font-label-lg text-label-lg">Pengeluaran</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("income")}
                className={
                  tab === "income"
                    ? "px-4 py-2 rounded-full flex items-center justify-center gap-space-xs bg-primary-container text-on-primary shadow-sm transition-all duration-200 shrink-0"
                    : "px-4 py-2 rounded-full flex items-center justify-center gap-space-xs text-on-surface-variant hover:text-on-surface transition-all duration-200 shrink-0"
                }
              >
                <span className="material-symbols-outlined text-[16px] text-primary">arrow_upward</span>
                <span className="font-label-lg text-label-lg">Pemasukan</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("debt")}
                className={
                  tab === "debt"
                    ? "px-4 py-2 rounded-full flex items-center justify-center gap-space-xs bg-secondary-container text-on-secondary-container shadow-sm transition-all duration-200 shrink-0"
                    : "px-4 py-2 rounded-full flex items-center justify-center gap-space-xs text-on-surface-variant hover:text-on-surface transition-all duration-200 shrink-0"
                }
              >
                <span className="material-symbols-outlined text-[16px] text-secondary">handshake</span>
                <span className="font-label-lg text-label-lg">Hutang/Piutang</span>
              </button>
            </div>
          </div>

          {/* Hero Amount Display with Interactive Numerical State */}
          <div className="px-margin-screen py-space-sm flex flex-col items-center justify-center">
            <span
              className={
                tab === "expense"
                  ? "font-label-md text-label-md uppercase tracking-wider text-tertiary bg-tertiary-fixed px-space-sm py-space-xxs rounded-full mb-space-xs flex items-center gap-1"
                  : tab === "income" 
                  ? "font-label-md text-label-md uppercase tracking-wider text-primary bg-primary-fixed px-space-sm py-space-xxs rounded-full mb-space-xs flex items-center gap-1"
                  : "font-label-md text-label-md uppercase tracking-wider text-secondary bg-secondary-fixed px-space-sm py-space-xxs rounded-full mb-space-xs flex items-center gap-1"
              }
            >
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${tab === "expense" ? "bg-tertiary" : tab === "income" ? "bg-primary" : "bg-secondary"}`} />
              {tab === "expense" ? "Nominal Pengeluaran" : tab === "income" ? "Nominal Pemasukan" : "Nominal Hutang/Piutang"}
            </span>

            {/* Centered large responsive amount input */}
            <div
              className="w-full flex items-center justify-center gap-2 cursor-text group my-1"
              onClick={() => amountInputRef.current?.focus()}
            >
              <select 
                value={currencyCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setCurrencyCode(code);
                  if (code === "USD") setExchangeRate(15500);
                  else if (code === "EUR") setExchangeRate(17000);
                  else if (code === "SGD") setExchangeRate(11600);
                  else setExchangeRate(1.0);
                }}
                className="font-headline-md sm:font-headline-lg text-primary font-bold bg-transparent outline-none cursor-pointer appearance-none text-right"
              >
                <option value="IDR">Rp</option>
                <option value="USD">$</option>
                <option value="EUR">€</option>
                <option value="SGD">S$</option>
              </select>
              <input
                ref={amountInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                aria-label="Nominal transaksi"
                placeholder="0"
                value={rawAmount > 0 ? formatRupiahAmount(rawAmount) : ""}
                onChange={handleAmountChange}
                onFocus={(e) => {
                  // Saat fokus, pilih semua teks agar mudah diganti langsung
                  e.target.select();
                }}
                className="w-auto min-w-[120px] max-w-[75vw] text-center font-display-currency text-[36px] sm:text-[44px] font-extrabold text-on-background tracking-tight bg-transparent focus:outline-none border-b-2 border-primary/30 focus:border-primary transition-all py-0.5 placeholder:text-outline/30"
              />
            </div>

            {/* Terbilang label (confirms amount in Indonesian words) */}
            {rawAmount > 0 && (
              <p className="font-label-md text-label-md text-primary font-semibold text-center mt-1 px-4 line-clamp-2">
                {formatTerbilang(rawAmount)}
              </p>
            )}

            {amountError ? (
              <span className="font-body-sm text-body-sm text-tertiary mt-space-xxs">{amountError}</span>
            ) : !rawAmount ? (
              <span className="font-body-sm text-body-sm text-outline mt-space-xxs">
                Ketuk area angka lalu ketik jumlah nominal
              </span>
            ) : null}
          </div>

          {/* Bagian Khusus Tab Hutang/Piutang */}
          {tab === "debt" && (
            <div className="px-margin-screen mt-space-md space-y-space-md">
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 space-y-space-md">
                
                {/* Tipe Hutang vs Piutang */}
                <div className="flex gap-2 p-1 bg-surface-container-low rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDebtType("HUTANG")}
                    className={`flex-1 py-2 rounded-md font-label-md transition-colors ${
                      debtType === "HUTANG" ? "bg-surface shadow-sm text-error font-bold" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Saya Berhutang (Kasbon)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtType("PIUTANG")}
                    className={`flex-1 py-2 rounded-md font-label-md transition-colors ${
                      debtType === "PIUTANG" ? "bg-surface shadow-sm text-secondary font-bold" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Memberi Hutang (Piutang)
                  </button>
                </div>

                {/* Nama Kontak */}
                <div className="mt-4">
                  <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                    {debtType === "HUTANG" ? "Kepada Siapa Anda Berhutang?" : "Siapa yang Berhutang Kepada Anda?"}
                  </label>
                  <div className="relative flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low focus-within:ring-2 ring-primary transition-shadow">
                    <span className="material-symbols-outlined text-outline text-[20px]">person</span>
                    <input
                      type="text"
                      className="flex-1 bg-transparent font-body-lg text-body-lg text-on-surface placeholder:text-outline focus:outline-none"
                      placeholder="Masukkan nama kontak..."
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Info Otomatis Saldo */}
                <div className="flex items-start gap-3 p-3 bg-secondary-container/20 text-on-surface rounded-lg mt-4">
                  <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">info</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {debtType === "HUTANG" ? "Uang pinjaman ini akan otomatis ditambahkan ke saldo dompet Anda." : 
                     "Uang yang Anda pinjamkan akan memotong saldo dompet Anda."}
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* Category Grid Section (Hanya untuk Expense/Income) */}
          {tab !== "debt" && (
            <div className="px-margin-screen mt-space-xs">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-lg text-label-lg text-on-surface">Pilih Kategori</span>
                <span className="font-label-md text-label-md text-primary font-bold">
                  {applicableCategories.length} Kategori
                </span>
              </div>
              <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                {applicableCategories.map((category) => {
                  const selected = category.id === categoryId;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryId(category.id)}
                      className={`category-btn relative flex flex-col items-center justify-center p-space-xs rounded-2xl text-on-surface transition-all duration-150 active:scale-95 cursor-pointer border-2 ${
                        selected
                          ? "bg-primary/15 border-primary shadow-md"
                          : "bg-surface-container-low border-transparent hover:bg-surface-container hover:border-outline-variant/50"
                      }`}
                    >
                      {/* pointer-events-none pada semua elemen anak agar klik selalu naik ke button induk */}
                      {selected && (
                        <span className="pointer-events-none absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      <div
                        className={`pointer-events-none w-11 h-11 rounded-xl ${category.bg} ${category.text} flex items-center justify-center mb-space-xxs transition-transform ${
                          selected ? "scale-105 shadow-md" : ""
                        }${category.iconShadow ? " shadow-sm" : ""}`}
                      >
                        <span className="pointer-events-none material-symbols-outlined text-[22px]">{category.icon}</span>
                      </div>
                      <span
                        className={`pointer-events-none font-label-md text-label-md text-center line-clamp-1 ${
                          selected ? "text-primary font-bold" : ""
                        }`}
                      >
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                        {formatTransactionDateLabel(selectedDate, new Date())}
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
                {wallets.length > 0 ? (
                  <>
                    <div className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low text-left">
                      <div className="flex items-center gap-space-xs min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-caps text-label-caps text-outline uppercase">Sumber Rekening</span>
                          <span className="font-label-lg text-label-lg text-on-surface truncate">
                            {wallets.find((w) => w.id === resolvedWalletId)
                              ? getWalletDisplayLabel(wallets.find((w) => w.id === resolvedWalletId)!)
                              : "Pilih dompet"}
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
                    </div>
                    <select
                      aria-label="Pilih dompet sumber"
                      value={resolvedWalletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    >
                      {wallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.id}>
                          {getWalletDisplayLabel(wallet)}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <Link href="/dompet" className="w-full flex items-center justify-between p-space-sm rounded-lg bg-primary-container text-on-primary-container text-left hover:brightness-95 transition-all">
                    <div className="flex items-center gap-space-xs min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-caps text-label-caps uppercase opacity-80">Sumber Rekening Kosong</span>
                        <span className="font-label-lg text-label-lg truncate font-bold">
                          + Buat Dompet Pertama
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </Link>
                )}
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

          {/* Sticky Bottom Floating Action Button (Always visible on mobile & web) */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/15 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
            <div className="max-w-lg mx-auto px-margin-screen py-3 pb-safe">
              <button
                type="button"
                disabled={status !== "idle"}
                onClick={handleSave}
                className="w-full h-[52px] bg-primary hover:bg-primary-container text-on-primary rounded-2xl flex items-center justify-center gap-space-xs font-label-lg text-label-lg shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-80 disabled:pointer-events-none cursor-pointer"
              >
                {status === "idle" && (
                  <>
                    <span className="material-symbols-outlined text-[22px]">check_circle</span>
                    <span>{isEditing ? "Simpan Perubahan" : "Simpan Transaksi"}</span>
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
        </div>
      </main>
    </>
  );
}
