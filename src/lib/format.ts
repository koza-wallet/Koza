/** Formats a number as Indonesian thousands-grouped digits, no currency symbol (matches "15.500.000" style used in the design). */
export function formatRupiahAmount(amount: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    Math.abs(Math.round(amount))
  );
}

/** Formats a signed amount with a +/- prefix and "Rp", e.g. "+ Rp 5.000.000" / "- Rp 45.000". */
export function formatSignedRupiah(amount: number, direction: "income" | "expense"): string {
  const sign = direction === "income" ? "+" : "-";
  return `${sign} Rp ${formatRupiahAmount(amount)}`;
}

/** Compact signed amount, no space after the sign, e.g. "+Rp 1.360.000" / "-Rp 87.000" — matches the Riwayat day-group header style. */
export function formatSignedRupiahCompact(amount: number): string {
  const sign = amount >= 0 ? "+" : "-";
  return `${sign}Rp ${formatRupiahAmount(amount)}`;
}

/** Abbreviated amount for tight spaces, e.g. "Rp 924 rb", "Rp 2,4 jt" — matches the Laporan donut legend style. */
export function formatCompactRupiah(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    const millions = Math.round((abs / 1_000_000) * 10) / 10;
    return `Rp ${millions.toString().replace(".", ",")} jt`;
  }
  if (abs >= 1_000) {
    return `Rp ${Math.round(abs / 1_000)} rb`;
  }
  return `Rp ${abs}`;
}

/** Full Indonesian date, e.g. "Senin, 20 Juli 2026". */
export function formatFullDateId(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Short time, e.g. "12:30". */
export function formatTimeId(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Relative day + time label matching the design's "Hari ini, 12:30" /
 * "Kemarin, 09:00" / "18 Jul, 16:20" pattern, computed against a reference date
 * (so mock data stays reproducible instead of drifting with the real clock).
 */
export function formatRelativeDateTimeId(timestamp: string, referenceDate: Date): string {
  const date = new Date(timestamp);
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round(
    (startOf(referenceDate).getTime() - startOf(date).getTime()) / (1000 * 60 * 60 * 24)
  );

  const time = formatTimeId(date);
  if (dayDiff === 0) return `Hari ini, ${time}`;
  if (dayDiff === 1) return `Kemarin, ${time}`;

  const dayMonth = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
    date
  );
  return `${dayMonth}, ${time}`;
}

/**
 * Date label matching the "Catat Transaksi" form's date row, e.g.
 * "Hari ini, 20 Juli 2026" when `date` is the same day as `referenceDate`,
 * otherwise "Senin, 20 Juli 2026".
 */
export function formatTransactionDateLabel(date: Date, referenceDate: Date): string {
  const isSameDay =
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getDate() === referenceDate.getDate();

  const dayMonthYear = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  if (isSameDay) return `Hari ini, ${dayMonthYear}`;

  const weekday = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(date);
  return `${weekday}, ${dayMonthYear}`;
}

/**
 * Day-group header label matching the Riwayat Transaksi export, e.g.
 * "Hari Ini • 20 Juli 2026", "Kemarin • 19 Juli 2026", "Rabu • 15 Juli 2026".
 */
export function formatDayGroupLabel(date: Date, referenceDate: Date): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round(
    (startOf(referenceDate).getTime() - startOf(date).getTime()) / (1000 * 60 * 60 * 24)
  );

  const dayMonthYear = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  if (dayDiff === 0) return `Hari Ini • ${dayMonthYear}`;
  if (dayDiff === 1) return `Kemarin • ${dayMonthYear}`;

  const weekday = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(date);
  return `${weekday} • ${dayMonthYear}`;
}

/** yyyy-MM-dd, the value format native `<input type="date">` expects/emits. */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Combines a picked calendar day with another Date's time-of-day, returned as an ISO timestamp. */
export function combineDateWithTimeOfDay(dateOnly: Date, timeSource: Date): string {
  const combined = new Date(dateOnly);
  combined.setHours(
    timeSource.getHours(),
    timeSource.getMinutes(),
    timeSource.getSeconds(),
    0
  );
  return combined.toISOString();
}
