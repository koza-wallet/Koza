"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getCategoryByIcon } from "@/lib/categories";
import { formatTimeId } from "@/lib/format";
import type { Transaction } from "@/lib/types";

interface IconTheme {
  bg: string;
  text: string;
}

/**
 * Icon container color for the Riwayat Transaksi row. Resolved from the
 * shared category catalog (so it stays consistent everywhere a category is
 * shown), falling back to a direction-based tone for categories the catalog
 * doesn't cover (e.g. older mock transactions like "Gaji").
 */
function getIconTheme(transaction: Transaction): IconTheme {
  const category = getCategoryByIcon(transaction.categoryIcon);
  if (category) return { bg: category.bg, text: category.text };
  return transaction.direction === "income"
    ? { bg: "bg-primary-fixed", text: "text-on-primary-fixed" }
    : { bg: "bg-tertiary-fixed", text: "text-on-tertiary-fixed" };
}

interface TransactionRowProps {
  transaction: Transaction;
}

/** Transaction row, markup + classes ported verbatim from the Stitch "Riwayat Transaksi" export. */
export function TransactionRow({ transaction }: TransactionRowProps) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);
  const iconTheme = getIconTheme(transaction);
  const amountColor = transaction.direction === "income" ? "text-primary" : "text-tertiary";
  const categoryColor = transaction.direction === "income" ? "text-primary" : "text-outline";
  const sign = transaction.direction === "income" ? "+" : "-";

  function handleClick() {
    setPressed(true);
    window.setTimeout(() => setPressed(false), 180);
    router.push(`/transaksi/${transaction.id}`);
  }

  return (
    <div
      onClick={handleClick}
      className={`tx-item flex items-center justify-between p-space-xs rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer ${
        pressed ? "bg-surface-container-high" : ""
      }`}
    >
      <div className="flex items-center gap-space-sm min-w-0">
        <div className={`w-10 h-10 rounded-xl ${iconTheme.bg} flex items-center justify-center ${iconTheme.text} flex-shrink-0`}>
          <span className="material-symbols-outlined text-[20px]">{transaction.categoryIcon}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-label-lg text-label-lg text-on-surface truncate">{transaction.title}</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
            {transaction.paymentMethod} • {formatTimeId(new Date(transaction.timestamp))}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end flex-shrink-0 pl-space-xs">
        <span className={`font-label-lg text-label-lg ${amountColor} whitespace-nowrap`}>
          {sign} Rp {new Intl.NumberFormat("id-ID").format(transaction.amount)}
        </span>
        <span className={`font-label-caps text-label-caps ${categoryColor}`}>{transaction.category}</span>
      </div>
    </div>
  );
}
