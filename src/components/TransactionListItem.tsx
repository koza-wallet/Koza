import { formatRelativeDateTimeId, formatSignedRupiah } from "@/lib/format";
import type { Transaction } from "@/lib/types";

interface IconTheme {
  bg: string;
  text: string;
}

/**
 * Icon container color, ported from the 3 example rows in the Stitch export:
 * income -> primary, "shopping_bag" category -> secondary, everything else
 * expense -> tertiary (the design's alert/expense color).
 */
function getIconTheme(transaction: Transaction): IconTheme {
  if (transaction.categoryIcon === "shopping_bag") {
    return { bg: "bg-secondary-fixed", text: "text-secondary" };
  }
  if (transaction.direction === "income") {
    return { bg: "bg-primary-fixed/60", text: "text-primary" };
  }
  return { bg: "bg-tertiary-fixed/60", text: "text-tertiary" };
}

interface TransactionListItemProps {
  transaction: Transaction;
  referenceDate: Date;
  onClick?: () => void;
}

/** Transaction row, markup + classes ported verbatim from the Stitch "Beranda" export. */
export function TransactionListItem({ transaction, referenceDate, onClick }: TransactionListItemProps) {
  const iconTheme = getIconTheme(transaction);
  const amountColor = transaction.direction === "income" ? "text-primary" : "text-tertiary";
  const paymentMethodColor = transaction.paymentMethod.includes("Transfer")
    ? "text-primary"
    : "text-outline-variant";

  return (
    <div
      onClick={onClick}
      className="bg-surface-container-lowest hover:bg-surface-container-low/60 transition-colors p-space-sm rounded-[18px] shadow-sm flex items-center justify-between gap-space-sm active:scale-[0.99] cursor-pointer"
    >
      <div className="flex items-center gap-space-sm min-w-0">
        <div
          className={`w-11 h-11 rounded-[14px] ${iconTheme.bg} flex items-center justify-center ${iconTheme.text} flex-shrink-0 shadow-sm`}
        >
          <span className="material-symbols-outlined text-[22px]">{transaction.categoryIcon}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-label-lg text-label-lg text-on-surface truncate">{transaction.title}</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
            <span>{transaction.category}</span>
            <span>•</span>
            <span>{formatRelativeDateTimeId(transaction.timestamp, referenceDate)}</span>
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end flex-shrink-0">
        <span className={`font-label-lg text-label-lg ${amountColor} font-bold`}>
          {formatSignedRupiah(transaction.amount, transaction.direction)}
        </span>
        <span className={`font-label-caps text-label-caps ${paymentMethodColor} uppercase`}>
          {transaction.paymentMethod}
        </span>
      </div>
    </div>
  );
}
