import { getWalletDisplayLabel } from "./finance";
import { formatTimeId, toDateInputValue } from "./format";
import type { Transaction, Wallet } from "./types";

const CSV_HEADERS = [
  "Tanggal",
  "Waktu",
  "Judul",
  "Kategori",
  "Arah",
  "Nominal (Rp)",
  "Dompet",
  "Metode Pembayaran",
  "Catatan",
];

/** Wraps a field in quotes (doubling any internal quotes) only when it contains a comma, quote, or newline — otherwise returned as-is. */
function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(fields: string[]): string {
  return fields.map(csvField).join(",");
}

/** Builds a CSV string (header + one row per transaction) from live transaction/wallet data — no placeholder content. */
export function transactionsToCsv(transactions: Transaction[], wallets: Wallet[]): string {
  const rows = transactions.map((t) => {
    const date = new Date(t.timestamp);
    const wallet = wallets.find((w) => w.id === t.walletId);
    return csvRow([
      toDateInputValue(date),
      formatTimeId(date),
      t.title,
      t.category,
      t.direction === "income" ? "Masuk" : "Keluar",
      String(t.amount),
      wallet ? getWalletDisplayLabel(wallet) : "Tidak diketahui",
      t.paymentMethod,
      t.note ?? "",
    ]);
  });

  return [csvRow(CSV_HEADERS), ...rows].join("\r\n");
}

/** Triggers a client-side CSV file download via a temporary anchor element. No-ops on the server. */
export function downloadCsv(filename: string, csvContent: string): void {
  if (typeof window === "undefined") return;

  // UTF-8 BOM so Excel renders Indonesian text (e.g. "Rp", accented notes) correctly instead of mojibake.
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
