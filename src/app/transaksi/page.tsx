"use client";

import { useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { TransactionRow } from "@/components/TransactionRow";
import { useFinance } from "@/lib/finance-context";
import { getMonthlySummary, groupTransactionsByDay, isSameMonth } from "@/lib/finance";
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

export default function RiwayatTransaksiPage() {
  const { transactions } = useFinance();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const monthlySummary = getMonthlySummary(transactions, REFERENCE_DATE);
  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    REFERENCE_DATE
  );

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return transactions.filter((t) => {
      const requiredDirection = DIRECTION_BY_FILTER[activeFilter];
      const matchesDirection = !requiredDirection || t.direction === requiredDirection;
      const matchesMonth = activeFilter !== "bulan-ini" || isSameMonth(t.timestamp, REFERENCE_DATE);
      const matchesSearch = query === "" || t.title.toLowerCase().includes(query);
      return matchesDirection && matchesMonth && matchesSearch;
    });
  }, [transactions, activeFilter, searchQuery]);

  const dayGroups = useMemo(() => groupTransactionsByDay(filteredTransactions), [filteredTransactions]);

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-screen flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Transaksi</h1>
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
                          group.net >= 0 ? "text-primary" : "text-outline"
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

      <BottomNav />
    </>
  );
}
