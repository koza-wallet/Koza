"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { TransactionRow } from "@/components/TransactionRow";
import { getCategoryById } from "@/lib/categories";
import { useFinance } from "@/lib/finance-context";
import { getMonthlySummary, getWalletDisplayLabel, groupTransactionsByDay, isSameMonth } from "@/lib/finance";
import { formatDayGroupLabel, formatSignedRupiahCompact } from "@/lib/format";
import { REFERENCE_DATE } from "@/lib/mock-data";
import type { TransactionDirection } from "@/lib/types";

type FilterType = "all" | "keluar" | "masuk" | "bulan-ini";

const FILTER_CHIPS: { type: FilterType; label: string }[] = [
  { type: "all", label: "Semua" },
  { type: "keluar", label: "Duit Keluar" },
  { type: "masuk", label: "Duit Masuk" },
  { type: "bulan-ini", label: "Bulan Ini" },
];

const DIRECTION_BY_FILTER: Partial<Record<FilterType, TransactionDirection>> = {
  keluar: "expense",
  masuk: "income",
};

/** `useSearchParams()` (for the `?category=` deep link from Kelola Kategori) requires a Suspense boundary in the App Router. */
export default function RiwayatTransaksiPage() {
  return (
    <Suspense fallback={null}>
      <RiwayatTransaksiContent />
    </Suspense>
  );
}

function RiwayatTransaksiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category");

  const { transactions, wallets } = useFinance();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [walletFilter, setWalletFilter] = useState<string>("all");
  const [sortAsc, setSortAsc] = useState(false);

  const monthlySummary = getMonthlySummary(transactions, REFERENCE_DATE);
  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    REFERENCE_DATE
  );

  const categoryFilterLabel = categoryId ? getCategoryById(categoryId).fullName : null;

  const query = searchQuery.trim().toLowerCase();
  const filteredTransactions = transactions.filter((t) => {
    const requiredDirection = DIRECTION_BY_FILTER[activeFilter];
    const matchesDirection = !requiredDirection || t.direction === requiredDirection;
    const matchesMonth = activeFilter !== "bulan-ini" || isSameMonth(t.timestamp, REFERENCE_DATE);
    const matchesSearch = query === "" || t.title.toLowerCase().includes(query);
    const matchesCategory = !categoryId || t.categoryId === categoryId;
    const matchesWallet = walletFilter === "all" || t.walletId === walletFilter;
    return matchesDirection && matchesMonth && matchesSearch && matchesCategory && matchesWallet;
  });

  const groupedByDay = groupTransactionsByDay(filteredTransactions);
  const dayGroups = sortAsc ? [...groupedByDay].reverse() : groupedByDay;

  function resetAdvancedFilters() {
    setWalletFilter("all");
    setSortAsc(false);
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-screen flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Transaksi</h1>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => alert("Belum ada notifikasi baru")}
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
          <div className="px-margin-screen pt-space-xs pb-space-lg flex flex-col gap-space-md">
            {/* Top Total Summary Highlight */}
            <section className="bg-surface-container-low rounded-xl p-space-md shadow-sm">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">Ringkasan Arus Kas</span>
                <span className="font-label-caps text-label-caps text-primary bg-primary-fixed/40 px-space-xs py-0.5 rounded-full">
                  {monthLabel}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-space-xs">
                <div className="bg-surface-container-lowest rounded-lg p-space-xs flex flex-col shadow-sm">
                  <div className="flex items-center gap-1 text-primary mb-1">
                    <span className="material-symbols-outlined text-[16px]">arrow_downward_alt</span>
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                      Total Masuk
                    </span>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-primary tracking-tight">
                    {formatSignedRupiahCompact(monthlySummary.income)}
                  </span>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-space-xs flex flex-col shadow-sm">
                  <div className="flex items-center gap-1 text-tertiary mb-1">
                    <span className="material-symbols-outlined text-[16px]">arrow_upward_alt</span>
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                      Total Keluar
                    </span>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-tertiary tracking-tight">
                    {formatSignedRupiahCompact(-monthlySummary.expense)}
                  </span>
                </div>
              </div>
            </section>

            {/* Category Deep-Link Banner (from Kelola Kategori) */}
            {categoryFilterLabel && (
              <div className="flex items-center justify-between bg-surface-container-low rounded-full pl-space-md pr-space-xs py-1.5">
                <span className="font-label-md text-label-md text-on-surface-variant truncate">
                  Kategori: <span className="text-on-surface font-semibold">{categoryFilterLabel}</span>
                </span>
                <button
                  aria-label="Hapus filter kategori"
                  type="button"
                  onClick={() => router.push("/transaksi")}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Search Bar & Filter Controls */}
            <div className="flex items-center gap-space-xs">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-surface-container-lowest text-on-surface rounded-xl font-body-md text-body-md placeholder:text-outline focus:outline-none shadow-sm transition-all"
                  placeholder="Cari transaksi..."
                  type="search"
                />
              </div>
              <button
                aria-label="Buka Filter Lanjutan"
                onClick={() => setIsFilterSheetOpen(true)}
                className="relative w-11 h-11 flex-shrink-0 bg-surface-container-lowest text-on-surface rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]">tune</span>
              </button>
            </div>

            {/* Quick Filter Chips Scrollable Row */}
            <div className="flex items-center gap-space-xs overflow-x-auto py-1 no-scrollbar -mx-margin-screen px-margin-screen">
              {FILTER_CHIPS.map((chip) => {
                const active = chip.type === activeFilter;
                return (
                  <button
                    key={chip.type}
                    onClick={() => setActiveFilter(chip.type)}
                    className={
                      active
                        ? "filter-chip active flex-shrink-0 px-space-md py-1.5 rounded-full font-label-md text-label-md bg-primary text-on-primary shadow-sm transition-all"
                        : "filter-chip flex-shrink-0 px-space-md py-1.5 rounded-full font-label-md text-label-md bg-surface-container-lowest text-on-surface-variant shadow-sm active:scale-95 transition-all"
                    }
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Grouped Chronological List */}
            {dayGroups.length > 0 ? (
              <div className="flex flex-col gap-space-lg">
                {dayGroups.map((group) => (
                  <section key={group.dateKey} className="group-section flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between px-1">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        {formatDayGroupLabel(group.date, REFERENCE_DATE)}
                      </span>
                      <span
                        className={`font-label-caps text-label-caps ${
                          group.net > 0 ? "text-primary" : group.net < 0 ? "text-tertiary" : "text-outline"
                        }`}
                      >
                        {formatSignedRupiahCompact(group.net)}
                      </span>
                    </div>
                    <div className="bg-surface-container-lowest rounded-xl p-space-xs flex flex-col gap-space-xs shadow-sm">
                      {group.transactions.map((transaction) => (
                        <TransactionRow key={transaction.id} transaction={transaction} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-space-3xl px-space-md text-center">
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-secondary mb-space-sm">
                  <span className="material-symbols-outlined text-[32px]">receipt_long</span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface mb-1">
                  Transaksi Tidak Ditemukan
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
                  Coba ganti kata kunci pencarian atau sesuaikan filter untuk melihat catatan pengeluaran &amp;
                  pemasukan Anda.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Advanced Filter Bottom Sheet */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <button
            aria-label="Tutup"
            onClick={() => setIsFilterSheetOpen(false)}
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-t-[28px] p-space-lg pb-safe shadow-2xl space-y-space-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Filter Lanjutan</h3>
              <button
                aria-label="Tutup"
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-space-xs">
              <span className="font-label-caps text-label-caps text-outline uppercase px-space-xxs">
                Dompet Sumber
              </span>
              <div className="relative">
                <div className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low text-left">
                  <div className="flex items-center gap-space-xs min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                    </div>
                    <span className="font-label-lg text-label-lg text-on-surface truncate">
                      {walletFilter === "all"
                        ? "Semua Dompet"
                        : getWalletDisplayLabel(wallets.find((w) => w.id === walletFilter)!)}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[20px]">expand_more</span>
                </div>
                <select
                  aria-label="Pilih dompet sumber"
                  value={walletFilter}
                  onChange={(e) => setWalletFilter(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  <option value="all">Semua Dompet</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {getWalletDisplayLabel(wallet)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-space-xs">
              <span className="font-label-caps text-label-caps text-outline uppercase px-space-xxs">Urutan</span>
              <div className="p-space-xxs bg-surface-container rounded-full flex items-center shadow-inner">
                <button
                  type="button"
                  onClick={() => setSortAsc(false)}
                  className={
                    !sortAsc
                      ? "flex-1 py-space-xs px-space-md rounded-full bg-primary-container text-on-primary shadow-sm transition-all duration-200 font-label-md text-label-md"
                      : "flex-1 py-space-xs px-space-md rounded-full text-on-surface-variant hover:text-on-surface transition-all duration-200 font-label-md text-label-md"
                  }
                >
                  Terbaru Dahulu
                </button>
                <button
                  type="button"
                  onClick={() => setSortAsc(true)}
                  className={
                    sortAsc
                      ? "flex-1 py-space-xs px-space-md rounded-full bg-primary-container text-on-primary shadow-sm transition-all duration-200 font-label-md text-label-md"
                      : "flex-1 py-space-xs px-space-md rounded-full text-on-surface-variant hover:text-on-surface transition-all duration-200 font-label-md text-label-md"
                  }
                >
                  Terlama Dahulu
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(false)}
              className="w-full h-[52px] bg-primary-container hover:bg-primary text-on-primary rounded-[16px] flex items-center justify-center gap-space-xs font-label-lg text-label-lg shadow-md transition-all active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>Terapkan Filter</span>
            </button>
            <button
              type="button"
              onClick={resetAdvancedFilters}
              className="w-full h-11 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant flex items-center justify-center gap-1.5 font-label-lg text-label-lg transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              <span>Reset Filter</span>
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
