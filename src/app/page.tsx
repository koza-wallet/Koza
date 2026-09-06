"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { TransactionListItem } from "@/components/TransactionListItem";
import { getMonthlySummary, getRecentTransactions, getTotalBalance } from "@/lib/finance";
import { formatFullDateId, formatRupiahAmount, formatSignedRupiah } from "@/lib/format";
import { useFinance } from "@/lib/finance-context";
import { REFERENCE_DATE, currentUser } from "@/lib/mock-data";

const HIDDEN_BALANCE_PLACEHOLDER = "••••••••";
const RECENT_TRANSACTIONS_LIMIT = 3;

export default function BerandaPage() {
  const router = useRouter();
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { wallets, transactions } = useFinance();

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }

  const totalBalance = getTotalBalance(wallets);
  const monthlySummary = getMonthlySummary(transactions, REFERENCE_DATE);
  const recentTransactions = getRecentTransactions(transactions, RECENT_TRANSACTIONS_LIMIT);

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-screen flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Beranda</h1>
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
        <div className="flex flex-col w-full">
          {/* Top Greeting & Context */}
          <div className="px-margin-screen pt-space-xs pb-space-md flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-sm bg-surface-container-high flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-full h-full object-cover" alt="" src={currentUser.avatarUrl} />
              </div>
              <div className="flex flex-col">
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  {formatFullDateId(REFERENCE_DATE)}
                </span>
                <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                  Halo, {currentUser.name}! 👋
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-space-xs">
              <button
                aria-label="Target Keuangan"
                className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">donut_small</span>
              </button>
              <div className="relative">
                <button
                  aria-label="Notifikasi penting"
                  className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                </button>
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(188,11,59,0.6)]" />
              </div>
            </div>
          </div>

          <div className="px-margin-screen flex flex-col gap-space-lg">
            {/* Hero Total Balance Card */}
            <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#005236] via-[#006c49] to-[#003823] p-space-lg text-white shadow-xl">
              <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-primary-fixed/10 blur-2xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-secondary-container/10 blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse" />
                    <span className="font-label-md text-label-md uppercase tracking-wider text-primary-fixed font-semibold">
                      Total Saldo Saat Ini
                    </span>
                  </div>
                  <button
                    onClick={() => setIsBalanceHidden((v) => !v)}
                    aria-label={isBalanceHidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isBalanceHidden ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                <div className="flex flex-col gap-space-xxs">
                  <div className="flex items-baseline gap-2">
                    <span className="font-label-lg text-label-lg opacity-80">Rp</span>
                    <span className="font-display-currency text-display-currency tracking-tight">
                      {isBalanceHidden ? HIDDEN_BALANCE_PLACEHOLDER : formatRupiahAmount(totalBalance)}
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs pt-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed/20 px-2.5 py-0.5 font-label-caps text-label-caps text-primary-fixed">
                      <span className="material-symbols-outlined text-[13px]">trending_up</span>
                      +2.4% bln ini
                    </span>
                    <span className="font-body-sm text-body-sm text-white/80">Dompet Aktif &amp; Simpanan</span>
                  </div>
                </div>
                {/* Micro Quick Actions Bar inside Card */}
                <div className="pt-space-xs flex items-center justify-between gap-space-xs">
                  <button onClick={() => showToast("Fitur Top Up akan hadir di rilis mendatang")} className="flex-1 py-2 px-space-xs bg-white/10 hover:bg-white/15 active:scale-98 rounded-xl flex items-center justify-center gap-1.5 transition-all">
                    <span className="material-symbols-outlined text-[16px] text-primary-fixed">add_circle</span>
                    <span className="font-label-md text-label-md text-white/90">Top Up</span>
                  </button>
                  <button onClick={() => showToast("Fitur Transfer akan hadir di rilis mendatang")} className="flex-1 py-2 px-space-xs bg-white/10 hover:bg-white/15 active:scale-98 rounded-xl flex items-center justify-center gap-1.5 transition-all">
                    <span className="material-symbols-outlined text-[16px] text-secondary-fixed">send_money</span>
                    <span className="font-label-md text-label-md text-white/90">Transfer</span>
                  </button>
                  <button onClick={() => showToast("Fitur Kantong akan hadir di rilis mendatang")} className="flex-1 py-2 px-space-xs bg-white/10 hover:bg-white/15 active:scale-98 rounded-xl flex items-center justify-center gap-1.5 transition-all">
                    <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">savings</span>
                    <span className="font-label-md text-label-md text-white/90">Kantong</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Income & Expense Split Summary Cards */}
            <div className="grid grid-cols-2 gap-space-md">
              <div className="bg-surface-container-lowest p-space-md rounded-[20px] shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-primary/5 pointer-events-none" />
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-md text-label-md text-on-surface-variant font-semibold">Duit Masuk</span>
                  <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">arrow_downward_alt</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight">
                    {formatSignedRupiah(monthlySummary.income, "income")}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    {monthlySummary.incomeCount} transaksi masuk
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-[20px] shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-tertiary/5 pointer-events-none" />
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-md text-label-md text-on-surface-variant font-semibold">Duit Keluar</span>
                  <div className="w-8 h-8 rounded-full bg-tertiary-container/30 flex items-center justify-center text-tertiary flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">arrow_upward_alt</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-tertiary font-bold tracking-tight">
                    {formatSignedRupiah(monthlySummary.expense, "expense")}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    {monthlySummary.expenseCount} pos pengeluaran
                  </span>
                </div>
              </div>
            </div>

            {/* Mini Cash Flow Trend Chart Card */}
            <div className="bg-surface-container-lowest rounded-[20px] p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">insights</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Alur Kas Bulan Ini</h3>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {monthlySummary.net >= 0 ? "Arus saldo positif & stabil" : "Arus saldo defisit bulan ini"}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-label-caps text-label-caps text-on-surface-variant font-semibold">
                  1 - 31 Juli
                </span>
              </div>
              <div className="w-full pt-space-xs pb-space-xxs flex flex-col">
                <div className="relative w-full h-28">
                  <svg className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 320 90">
                    <defs>
                      <linearGradient id="flowGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line stroke="#dae2fd" strokeDasharray="3 3" strokeOpacity="0.4" x1="0" x2="320" y1="20" y2="20" />
                    <line stroke="#dae2fd" strokeDasharray="3 3" strokeOpacity="0.4" x1="0" x2="320" y1="55" y2="55" />
                    <path d="M 0,72 Q 40,65 80,45 T 160,35 T 240,50 T 320,18 L 320,90 L 0,90 Z" fill="url(#flowGradient)" />
                    <path
                      d="M 0,72 Q 40,65 80,45 T 160,35 T 240,50 T 320,18"
                      fill="none"
                      stroke="#006c49"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                    <circle cx="80" cy="45" fill="#faf8ff" r="3.5" stroke="#006c49" strokeWidth="2.5" />
                    <circle cx="160" cy="35" fill="#faf8ff" r="3.5" stroke="#006c49" strokeWidth="2.5" />
                    <circle cx="240" cy="50" fill="#faf8ff" r="3.5" stroke="#006c49" strokeWidth="2.5" />
                    <circle cx="320" cy="18" fill="#10B981" r="5" />
                    <circle cx="320" cy="18" fill="#10B981" fillOpacity="0.25" r="9" />
                  </svg>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-label-md text-label-md pt-1 px-1">
                  <span>Minggu 1</span>
                  <span>Minggu 2</span>
                  <span>Minggu 3</span>
                  <span className="text-primary font-bold">Minggu 4</span>
                </div>
              </div>
            </div>

            {/* Financial Health Micro Banner */}
            <div className="bg-surface-container-low rounded-[18px] p-space-md flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-[22px]">shield_with_heart</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-on-surface">
                    Skor Kesehatan: {currentUser.healthScore}/100
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Kebutuhan primer terkendali rapi!
                  </span>
                </div>
              </div>
              <button onClick={() => showToast("Fitur Analisis akan hadir di rilis mendatang")} className="px-3 py-1.5 rounded-full bg-surface-container-highest text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors">
                Analisis
              </button>
            </div>

            {/* Recent Activity Section */}
            <div className="flex flex-col gap-space-sm pb-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
                    Transaksi Terakhir
                  </h3>
                  <span className="w-5 h-5 rounded-full bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps flex items-center justify-center">
                    {recentTransactions.length}
                  </span>
                </div>
                <Link
                  href="/transaksi"
                  className="font-label-lg text-label-lg text-primary hover:underline flex items-center gap-0.5"
                >
                  Lihat Semua
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </Link>
              </div>
              <div className="flex flex-col gap-space-xs">
                {recentTransactions.map((transaction) => (
                  <TransactionListItem
                    key={transaction.id}
                    transaction={transaction}
                    referenceDate={REFERENCE_DATE}
                    onClick={() => router.push(`/transaksi/${transaction.id}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <div
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-space-md py-space-xs rounded-full bg-inverse-surface text-inverse-on-surface shadow-2xl flex items-center gap-space-xs z-50 max-w-[90vw] transition-all duration-300 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <span
          className="material-symbols-outlined text-[18px] text-primary-fixed"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          info
        </span>
        <span className="font-body-sm text-body-sm text-center">{toast}</span>
      </div>

      <BottomNav />
    </>
  );
}
