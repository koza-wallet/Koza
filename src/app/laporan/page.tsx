"use client";

import { useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useFinance } from "@/lib/finance-context";
import { getPeriodReport, shiftAnchor, type ReportGranularity } from "@/lib/report";
import { formatCompactRupiah, formatRupiahAmount } from "@/lib/format";
import { REFERENCE_DATE } from "@/lib/mock-data";

const GRANULARITY_OPTIONS: { type: ReportGranularity; label: string }[] = [
  { type: "harian", label: "Harian" },
  { type: "mingguan", label: "Mingguan" },
  { type: "bulanan", label: "Bulanan" },
  { type: "tahunan", label: "Tahunan" },
];

/** Donut/legend/progress-bar color per rank, cycling through the app's 3 accent containers before a neutral "Lainnya" rollup. */
const SLICE_THEME = [
  { stroke: "text-primary-container", dot: "bg-primary-container", text: "text-primary", iconBg: "bg-primary/10", iconText: "text-primary" },
  { stroke: "text-secondary-container", dot: "bg-secondary-container", text: "text-secondary", iconBg: "bg-secondary/10", iconText: "text-secondary" },
  { stroke: "text-tertiary-container", dot: "bg-tertiary-container", text: "text-tertiary", iconBg: "bg-tertiary/10", iconText: "text-tertiary" },
  { stroke: "text-outline-variant", dot: "bg-outline-variant", text: "text-on-surface-variant", iconBg: "bg-outline/10", iconText: "text-on-surface-variant" },
];

const DONUT_RADIUS = 46;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function formatDelta(changePct: number | null, previousLabel: string): string {
  if (changePct === null) return `Belum ada data ${previousLabel}`;
  const sign = changePct >= 0 ? "+" : "";
  return `${sign}${changePct}% dari ${previousLabel}`;
}

export default function LaporanPage() {
  const { transactions } = useFinance();
  const [granularity, setGranularity] = useState<ReportGranularity>("bulanan");
  const [anchorDate, setAnchorDate] = useState<Date>(REFERENCE_DATE);

  const report = useMemo(
    () => getPeriodReport(transactions, granularity, anchorDate),
    [transactions, granularity, anchorDate]
  );

  function handleGranularityChange(next: ReportGranularity) {
    setGranularity(next);
    setAnchorDate(REFERENCE_DATE);
  }

  function handlePrevPeriod() {
    setAnchorDate((a) => shiftAnchor(granularity, a, -1));
  }

  function handleNextPeriod() {
    setAnchorDate((a) => shiftAnchor(granularity, a, 1));
  }

  let dashCursor = 0;
  const donutSlices = report.categorySlices.map((slice, i) => {
    const dash = (slice.percentage / 100) * DONUT_CIRCUMFERENCE;
    const gap = DONUT_CIRCUMFERENCE - dash;
    const offset = -dashCursor;
    dashCursor += dash;
    return { ...slice, dash, gap, offset, theme: SLICE_THEME[i] ?? SLICE_THEME[3] };
  });

  const rankedCategories = report.categorySlices.filter((s) => s.category !== "Lainnya");

  const maxBucketValue = Math.max(1, ...report.buckets.flatMap((b) => [b.income, b.expense]));
  const barHeightPercent = (value: number) =>
    value <= 0 ? 0 : Math.max(4, Math.round((value / maxBucketValue) * 94));

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-screen flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Laporan</h1>
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
        <div className="flex flex-col w-full px-margin-screen space-y-space-lg">
          {/* Month/Period Selector & Header Action */}
          <div className="flex items-center justify-between pt-space-xs">
            <div className="flex items-center space-x-space-xs bg-surface-container-low px-space-md py-space-xs rounded-full shadow-sm">
              <button
                aria-label="Periode Sebelumnya"
                onClick={handlePrevPeriod}
                className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <div className="flex items-center space-x-1">
                <span
                  className="material-symbols-outlined text-primary text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  calendar_today
                </span>
                <span className="font-label-lg text-label-lg text-on-surface">{report.periodLabel}</span>
              </div>
              <button
                aria-label="Periode Berikutnya"
                onClick={handleNextPeriod}
                className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
            <button className="flex items-center space-x-space-xxs bg-surface-container-low px-space-md py-space-xs rounded-full text-on-surface-variant hover:text-primary transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span className="font-label-md text-label-md">Unduh</span>
            </button>
          </div>

          {/* Horizontal Filter Pills */}
          <div className="flex items-center space-x-space-xs overflow-x-auto no-scrollbar py-1">
            {GRANULARITY_OPTIONS.map((opt) => {
              const active = opt.type === granularity;
              return (
                <button
                  key={opt.type}
                  onClick={() => handleGranularityChange(opt.type)}
                  className={
                    active
                      ? "px-space-lg py-space-xs rounded-full font-label-md text-label-md bg-primary-container text-on-primary shadow-sm whitespace-nowrap"
                      : "px-space-md py-space-xs rounded-full font-label-md text-label-md bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors whitespace-nowrap"
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Highlights Bento Card */}
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-caps text-label-caps text-on-surface-variant">TOTAL PEMASUKAN</span>
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[14px]">arrow_downward</span>
                </div>
              </div>
              <div className="font-headline-sm text-headline-sm text-primary tracking-tight">
                Rp {formatRupiahAmount(report.income)}
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                {formatDelta(report.incomeChangePct, report.previousPeriodLabel)}
              </span>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-caps text-label-caps text-on-surface-variant">TOTAL PENGELUARAN</span>
                <div className="w-6 h-6 rounded-full bg-tertiary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary text-[14px]">arrow_upward</span>
                </div>
              </div>
              <div className="font-headline-sm text-headline-sm text-tertiary tracking-tight">
                Rp {formatRupiahAmount(report.expense)}
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                {formatDelta(report.expenseChangePct, report.previousPeriodLabel)}
              </span>
            </div>
          </div>

          {/* Expense Breakdown Donut Chart Card */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm space-y-space-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Kategori Pengeluaran</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Persentase pengeluaran {report.periodLabel}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">pie_chart</span>
              </div>
            </div>

            {donutSlices.length > 0 ? (
              <>
                <div className="relative flex items-center justify-center py-space-xs">
                  <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      fill="transparent"
                      r={DONUT_RADIUS}
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-surface-container-low"
                    />
                    {donutSlices.map((slice) => (
                      <circle
                        key={slice.category}
                        cx="60"
                        cy="60"
                        fill="transparent"
                        r={DONUT_RADIUS}
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${slice.dash} ${slice.gap}`}
                        strokeDashoffset={slice.offset}
                        className={slice.theme.stroke}
                      />
                    ))}
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="font-label-caps text-label-caps text-on-surface-variant">TOTAL BELANJA</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Rp {formatRupiahAmount(report.expense)}
                    </span>
                    <span className="font-body-sm text-body-sm text-primary">
                      {report.expenseCount} transaksi
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-space-xs pt-space-xs">
                  {donutSlices.map((slice) => (
                    <div
                      key={slice.category}
                      className="flex items-center space-x-space-xs bg-surface-container-low p-space-xs rounded-xl"
                    >
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${slice.theme.dot}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md text-on-surface truncate">{slice.category}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {slice.percentage}% ({formatCompactRupiah(slice.amount)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-space-lg">
                Belum ada pengeluaran pada periode ini.
              </p>
            )}
          </div>

          {/* Cash Flow Dual-Bar Chart Card */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm space-y-space-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Pemasukan vs Pengeluaran</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Arus kas per {granularity === "bulanan" ? "minggu" : granularity === "tahunan" ? "bulan" : granularity === "mingguan" ? "hari" : "periode"} — {report.periodLabel}
                </p>
              </div>
              <div className="flex items-center space-x-space-xs">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                  <span className="font-label-caps text-label-caps text-on-surface-variant">Masuk</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container" />
                  <span className="font-label-caps text-label-caps text-on-surface-variant">Keluar</span>
                </div>
              </div>
            </div>

            <div className="pt-space-xs overflow-x-auto no-scrollbar">
              <div className="h-44 w-full flex items-end justify-between px-space-xs pb-space-xs gap-1">
                {report.buckets.map((bucket) => (
                  <div key={bucket.label} className="flex flex-col items-center flex-1 space-y-space-xs">
                    <div className="flex items-end space-x-1.5 h-32">
                      <div
                        className="w-3.5 bg-primary-container rounded-t-md transition-all duration-500 hover:opacity-90"
                        style={{ height: `${barHeightPercent(bucket.income)}%` }}
                      />
                      <div
                        className="w-3.5 bg-tertiary-container rounded-t-md transition-all duration-500 hover:opacity-90"
                        style={{ height: `${barHeightPercent(bucket.expense)}%` }}
                      />
                    </div>
                    <span className="font-label-md text-label-md text-on-surface-variant">{bucket.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-low p-space-xs rounded-xl flex items-center justify-between">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Selisih Kas Bersih</span>
              <span className={`font-label-lg text-label-lg ${report.net >= 0 ? "text-primary" : "text-tertiary"}`}>
                {report.net >= 0 ? "+" : "-"} Rp {formatRupiahAmount(report.net)}
              </span>
            </div>
          </div>

          {/* Detailed Breakdown List (Ranked Categories) */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm space-y-space-md mb-space-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Rincian Pengeluaran</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Urutan pos belanja tertinggi</p>
              </div>
              <span className="font-label-md text-label-md text-primary">Lihat Semua</span>
            </div>

            {rankedCategories.length > 0 ? (
              <div className="space-y-space-md">
                {rankedCategories.map((slice, i) => {
                  const theme = SLICE_THEME[i];
                  return (
                    <div key={slice.category} className="space-y-space-xxs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-space-xs min-w-0">
                          <div className={`w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center flex-shrink-0`}>
                            <span className={`material-symbols-outlined ${theme.iconText} text-[20px]`}>
                              {slice.categoryIcon}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-label-lg text-label-lg text-on-surface truncate">{slice.category}</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              {slice.count} transaksi
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                          <span className="font-label-lg text-label-lg text-on-surface">
                            Rp {formatRupiahAmount(slice.amount)}
                          </span>
                          <span className={`font-label-caps text-label-caps ${theme.text}`}>{slice.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                        <div className={`h-full ${theme.dot} rounded-full`} style={{ width: `${slice.percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-space-lg">
                Belum ada pengeluaran pada periode ini.
              </p>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  );
}
