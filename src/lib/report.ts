import type { Transaction } from "./types";
import { formatFullDateId } from "./format";

export type ReportGranularity = "harian" | "mingguan" | "bulanan" | "tahunan";

export interface ReportBucket {
  label: string;
  income: number;
  expense: number;
}

export interface CategorySlice {
  category: string;
  categoryIcon: string;
  amount: number;
  count: number;
  /** 0-100, rounded; shares across all slices sum to ~100 (subject to rounding). */
  percentage: number;
}

export interface PeriodReport {
  periodLabel: string;
  /** Short label for the "vs X" comparison line, e.g. "Juni 2026", "minggu lalu". */
  previousPeriodLabel: string;
  rangeStart: Date;
  rangeEnd: Date;
  income: number;
  expense: number;
  net: number;
  incomeCount: number;
  expenseCount: number;
  /** Percent change vs the previous period of the same granularity; null when the previous period has no baseline to compare against. */
  incomeChangePct: number | null;
  expenseChangePct: number | null;
  buckets: ReportBucket[];
  /** Expense breakdown by category, sorted descending, capped to top 3 + a "Lainnya" rollup. */
  categorySlices: CategorySlice[];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = Sun .. 6 = Sat
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  return addDays(d, diffToMonday);
}
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function getRange(granularity: ReportGranularity, anchor: Date): { start: Date; end: Date } {
  switch (granularity) {
    case "harian": {
      const start = startOfDay(anchor);
      return { start, end: addDays(start, 1) };
    }
    case "mingguan": {
      const start = startOfWeek(anchor);
      return { start, end: addDays(start, 7) };
    }
    case "tahunan": {
      const start = startOfYear(anchor);
      return { start, end: new Date(start.getFullYear() + 1, 0, 1) };
    }
    case "bulanan":
    default: {
      const start = startOfMonth(anchor);
      return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 1) };
    }
  }
}

/** Shifts the anchor date by one period unit, so a chevron click can move to the next/previous day, week, month, or year. */
export function shiftAnchor(granularity: ReportGranularity, anchor: Date, direction: 1 | -1): Date {
  switch (granularity) {
    case "harian":
      return addDays(anchor, direction);
    case "mingguan":
      return addDays(anchor, 7 * direction);
    case "tahunan":
      return new Date(anchor.getFullYear() + direction, 0, 1);
    case "bulanan":
    default:
      return new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
  }
}

function sumInRange(transactions: Transaction[], start: Date, end: Date) {
  let income = 0;
  let expense = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  for (const t of transactions) {
    const time = new Date(t.timestamp).getTime();
    if (time < start.getTime() || time >= end.getTime()) continue;
    if (t.direction === "income") {
      income += t.amount;
      incomeCount++;
    } else {
      expense += t.amount;
      expenseCount++;
    }
  }
  return { income, expense, incomeCount, expenseCount };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

const WEEKDAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function getBuckets(
  granularity: ReportGranularity,
  range: { start: Date; end: Date },
  transactions: Transaction[]
): ReportBucket[] {
  switch (granularity) {
    case "harian": {
      const { income, expense } = sumInRange(transactions, range.start, range.end);
      return [{ label: formatFullDateId(range.start).split(",")[0], income, expense }];
    }
    case "mingguan": {
      return WEEKDAY_LABELS.map((label, i) => {
        const s = addDays(range.start, i);
        const { income, expense } = sumInRange(transactions, s, addDays(s, 1));
        return { label, income, expense };
      });
    }
    case "tahunan": {
      const year = range.start.getFullYear();
      return MONTH_LABELS.map((label, i) => {
        const s = new Date(year, i, 1);
        const e = new Date(year, i + 1, 1);
        const { income, expense } = sumInRange(transactions, s, e);
        return { label, income, expense };
      });
    }
    case "bulanan":
    default: {
      const totalDays = Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000);
      const bucketCount = Math.ceil(totalDays / 7);
      const buckets: ReportBucket[] = [];
      for (let i = 0; i < bucketCount; i++) {
        const s = addDays(range.start, i * 7);
        const e = addDays(s, Math.min(7, totalDays - i * 7));
        const { income, expense } = sumInRange(transactions, s, e);
        buckets.push({ label: `M${i + 1}`, income, expense });
      }
      return buckets;
    }
  }
}

function getCategorySlices(transactions: Transaction[], start: Date, end: Date): CategorySlice[] {
  const byCategory = new Map<string, { icon: string; amount: number; count: number }>();
  let totalExpense = 0;

  for (const t of transactions) {
    const time = new Date(t.timestamp).getTime();
    if (t.direction !== "expense" || time < start.getTime() || time >= end.getTime()) continue;
    totalExpense += t.amount;
    const entry = byCategory.get(t.category);
    if (entry) {
      entry.amount += t.amount;
      entry.count += 1;
    } else {
      byCategory.set(t.category, { icon: t.categoryIcon, amount: t.amount, count: 1 });
    }
  }

  const ranked = Array.from(byCategory.entries())
    .map(([category, v]) => ({ category, categoryIcon: v.icon, amount: v.amount, count: v.count }))
    .sort((a, b) => b.amount - a.amount);

  if (totalExpense === 0) return [];

  const top = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const restTotal = rest.reduce((sum, r) => sum + r.amount, 0);
  const restCount = rest.reduce((sum, r) => sum + r.count, 0);

  const slices: CategorySlice[] = top.map((r) => ({
    ...r,
    percentage: Math.round((r.amount / totalExpense) * 100),
  }));

  if (restTotal > 0) {
    slices.push({
      category: "Lainnya",
      categoryIcon: "more_horiz",
      amount: restTotal,
      count: restCount,
      percentage: Math.round((restTotal / totalExpense) * 100),
    });
  }

  return slices;
}

function formatPeriodLabel(granularity: ReportGranularity, range: { start: Date; end: Date }): string {
  switch (granularity) {
    case "harian":
      return formatFullDateId(range.start);
    case "mingguan": {
      const endInclusive = addDays(range.end, -1);
      const startLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric" }).format(range.start);
      const endLabel = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(endInclusive);
      return `${startLabel} - ${endLabel}`;
    }
    case "tahunan":
      return String(range.start.getFullYear());
    case "bulanan":
    default:
      return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(range.start);
  }
}

function formatPreviousPeriodLabel(granularity: ReportGranularity, previousAnchor: Date): string {
  switch (granularity) {
    case "harian":
      return "kemarin";
    case "mingguan":
      return "minggu lalu";
    case "tahunan":
      return String(previousAnchor.getFullYear());
    case "bulanan":
    default:
      return new Intl.DateTimeFormat("id-ID", { month: "long" }).format(previousAnchor);
  }
}

/** Aggregates the full Laporan view (highlights, bar-chart buckets, category donut/list) for one period, derived entirely from live transaction data. */
export function getPeriodReport(
  transactions: Transaction[],
  granularity: ReportGranularity,
  anchorDate: Date
): PeriodReport {
  const range = getRange(granularity, anchorDate);
  const previousAnchor = shiftAnchor(granularity, anchorDate, -1);
  const previousRange = getRange(granularity, previousAnchor);

  const current = sumInRange(transactions, range.start, range.end);
  const previous = sumInRange(transactions, previousRange.start, previousRange.end);

  return {
    periodLabel: formatPeriodLabel(granularity, range),
    previousPeriodLabel: formatPreviousPeriodLabel(granularity, previousAnchor),
    rangeStart: range.start,
    rangeEnd: range.end,
    income: current.income,
    expense: current.expense,
    net: current.income - current.expense,
    incomeCount: current.incomeCount,
    expenseCount: current.expenseCount,
    incomeChangePct: pctChange(current.income, previous.income),
    expenseChangePct: pctChange(current.expense, previous.expense),
    buckets: getBuckets(granularity, range, transactions),
    categorySlices: getCategorySlices(transactions, range.start, range.end),
  };
}
