"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useSession } from "@/lib/supabase-auth";
import { BottomNav } from "@/components/BottomNav";
import {
  DEFAULT_EXPENSE_CATEGORY_ID,
  DEFAULT_INCOME_CATEGORY_ID,
  getCategoriesForDirection,
} from "@/lib/categories";
import { useFinance } from "@/lib/finance-context";
import { getCategoryMonthlyStats } from "@/lib/finance";
import { formatRupiahAmount } from "@/lib/format";
import { REFERENCE_DATE } from "@/lib/mock-data";
import type { TransactionDirection } from "@/lib/types";

export default function KategoriTransaksiPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { transactions } = useFinance();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TransactionDirection>("expense");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const expenseCount = getCategoriesForDirection("expense").length;
  const incomeCount = getCategoriesForDirection("income").length;
  const defaultCategoryId = activeTab === "expense" ? DEFAULT_EXPENSE_CATEGORY_ID : DEFAULT_INCOME_CATEGORY_ID;

  const monthlyStats = useMemo(
    () => getCategoryMonthlyStats(transactions, activeTab, REFERENCE_DATE),
    [transactions, activeTab]
  );

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = getCategoriesForDirection(activeTab).filter(
      (c) => query === "" || c.name.toLowerCase().includes(query) || c.fullName.toLowerCase().includes(query)
    );
    const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name, "id-ID"));
    return sortAsc ? sorted : sorted.reverse();
  }, [activeTab, searchQuery, sortAsc]);

  const topCategory = useMemo(() => {
    if (monthlyStats.length === 0) return null;
    const totalAmount = monthlyStats.reduce((sum, s) => sum + s.amount, 0);
    const top = monthlyStats.reduce((max, s) => (s.amount > max.amount ? s : max), monthlyStats[0]);
    const category = getCategoriesForDirection(activeTab).find((c) => c.id === top.categoryId);
    if (!category || totalAmount === 0) return null;
    return { fullName: category.fullName, percentage: Math.round((top.amount / totalAmount) * 100) };
  }, [monthlyStats, activeTab]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }

  function handleCategoryClick(categoryId: string) {
    router.push(`/transaksi?category=${categoryId}`);
  }

  const directionNoun = activeTab === "expense" ? "pengeluaran" : "pemasukan";

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-screen flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <button
              aria-label="Kembali"
              onClick={() => router.back()}
              className="w-11 h-11 flex items-center justify-center -ml-2 rounded-full text-on-surface hover:bg-surface-container transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate">
              Kategori Transaksi
            </h1>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Cari Kategori"
              type="button"
              onClick={() => searchInputRef.current?.focus()}
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface px-margin-screen">
        <div className="flex flex-col w-full pb-6 space-y-space-md">
          {/* Hint Banner Edukasi */}
          <div className="relative overflow-hidden bg-surface-container-low rounded-xl p-space-md shadow-sm">
            <div className="flex items-start gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">tips_and_updates</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-headline-sm text-headline-sm text-on-surface">Atur Pos Keuangan</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xxs">
                  Kelola pos pengeluaran &amp; pemasukan agar catatan keuangan Anda lebih rapi terkendali.
                </p>
              </div>
            </div>
          </div>

          {/* Pencarian & Tab Segmented Control */}
          <div className="flex flex-col space-y-space-sm">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                ref={searchInputRef}
                className="w-full h-11 pl-11 pr-space-md bg-surface-container-lowest rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline shadow-sm focus:outline-none focus:bg-surface-container-low transition-all"
                placeholder="Cari nama kategori..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 p-1 bg-surface-container rounded-full shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab("expense")}
                className={
                  activeTab === "expense"
                    ? "flex items-center justify-center gap-space-xs py-2 px-space-md rounded-full bg-primary-container text-on-primary font-label-md text-label-md shadow-sm transition-all"
                    : "flex items-center justify-center gap-space-xs py-2 px-space-md rounded-full text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-all"
                }
              >
                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                <span>Duit Keluar</span>
                <span
                  className={
                    activeTab === "expense"
                      ? "px-2 py-0.5 rounded-full bg-on-primary-container/30 text-on-primary font-label-caps text-label-caps"
                      : "px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-caps text-label-caps"
                  }
                >
                  {expenseCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("income")}
                className={
                  activeTab === "income"
                    ? "flex items-center justify-center gap-space-xs py-2 px-space-md rounded-full bg-primary-container text-on-primary font-label-md text-label-md shadow-sm transition-all"
                    : "flex items-center justify-center gap-space-xs py-2 px-space-md rounded-full text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-all"
                }
              >
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                <span>Duit Masuk</span>
                <span
                  className={
                    activeTab === "income"
                      ? "px-2 py-0.5 rounded-full bg-on-primary-container/30 text-on-primary font-label-caps text-label-caps"
                      : "px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-caps text-label-caps"
                  }
                >
                  {incomeCount}
                </span>
              </button>
            </div>
          </div>

          {/* Metrik Sekilas Kategori */}
          <div className="flex items-center justify-between px-space-xxs pt-space-xxs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                Daftar Aktif
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {filteredCategories.length} Kategori
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSortAsc((v) => !v)}
              className="flex items-center gap-1 font-label-md text-label-md text-primary hover:opacity-80"
            >
              <span className="material-symbols-outlined text-[16px]">swap_vert</span>
              Urutan
            </button>
          </div>

          {/* List Kategori */}
          <div className="flex flex-col space-y-space-xs">
            {filteredCategories.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-space-lg">
                Tidak ada kategori yang cocok dengan pencarian.
              </p>
            ) : (
              filteredCategories.map((category) => {
                const stat = monthlyStats.find((s) => s.categoryId === category.id);
                const subtitle =
                  stat && stat.count > 0
                    ? `${stat.count} transaksi bulan ini • Rp ${formatRupiahAmount(stat.amount)}`
                    : "Belum ada transaksi bulan ini";
                const isDefault = category.id === defaultCategoryId;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryClick(category.id)}
                    className="group bg-surface-container-lowest hover:bg-surface-container-low transition-colors rounded-xl p-space-md flex items-center gap-space-sm shadow-sm text-left"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl ${category.bg} ${category.text} flex items-center justify-center shrink-0`}
                    >
                      <span className="material-symbols-outlined text-[22px]">{category.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-space-xs">
                        <p className="font-label-lg text-label-lg text-on-surface truncate">{category.fullName}</p>
                        {isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-caps text-label-caps shrink-0">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">{subtitle}</p>
                    </div>
                    <span
                      aria-label={`Lihat transaksi ${category.fullName}`}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-outline group-hover:text-on-surface group-hover:bg-surface-container transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Kartu Insight Pemanfaatan Kategori */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-full bg-primary-container/15 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">donut_large</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-label-md text-label-md text-on-surface">Pemanfaatan Kategori</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {topCategory
                  ? `${topCategory.fullName} memakan ${topCategory.percentage}% dari seluruh ${directionNoun} bulan ini.`
                  : `Belum ada data ${directionNoun} bulan ini.`}
              </p>
            </div>
          </div>

          {/* Tambah Kategori Baru */}
          <div className="pt-space-xs">
            <button
              type="button"
              onClick={() => {
                const tier = (session?.user as any)?.subscriptionTier || "FREE";
                if (tier === "FREE") {
                  showToast("🚀 Upgrade ke PRO untuk membuat Kategori Kustom!");
                } else {
                  showToast("Kategori kustom akan hadir di rilis mendatang");
                }
              }}
              className="w-full h-12 rounded-full bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-md active:scale-[0.99] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>+ Tambah Kategori Baru</span>
            </button>
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
          check_circle
        </span>
        <span className="font-body-sm text-body-sm">{toast}</span>
      </div>

      <BottomNav />
    </>
  );
}
