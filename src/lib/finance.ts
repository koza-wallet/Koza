import type { Transaction, TransactionDirection, Wallet } from "./types";

export function getTotalBalance(walletList: Wallet[]): number {
  return walletList.reduce((sum, wallet) => sum + wallet.balance, 0);
}

export function isSameMonth(timestamp: string, referenceDate: Date): boolean {
  const date = new Date(timestamp);
  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth()
  );
}

export interface MonthlySummary {
  income: number;
  incomeCount: number;
  expense: number;
  expenseCount: number;
  net: number;
}

/** Sums income/expense for the calendar month of `referenceDate`, derived from the transaction list (no hardcoded totals). */
export function getMonthlySummary(
  transactionList: Transaction[],
  referenceDate: Date
): MonthlySummary {
  const monthly = transactionList.filter((t) => isSameMonth(t.timestamp, referenceDate));

  const income = monthly.filter((t) => t.direction === "income");
  const expense = monthly.filter((t) => t.direction === "expense");

  const income_total = income.reduce((sum, t) => sum + t.amount, 0);
  const expense_total = expense.reduce((sum, t) => sum + t.amount, 0);

  return {
    income: income_total,
    incomeCount: income.length,
    expense: expense_total,
    expenseCount: expense.length,
    net: income_total - expense_total,
  };
}

/** Most recent transactions, newest first. */
export function getRecentTransactions(transactionList: Transaction[], limit: number): Transaction[] {
  return [...transactionList]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

/** Category label derived from a 0-100 health score, e.g. 88 -> "Sehat" — matches the Profil card's "Sehat (88/100)". */
export function getHealthScoreLabel(score: number): string {
  if (score >= 80) return "Sehat";
  if (score >= 60) return "Cukup Sehat";
  return "Perlu Perhatian";
}

export interface WalletMonthlyNet {
  count: number;
  net: number;
}

/** Transaction count + net (income - expense) for one wallet in the calendar month of `referenceDate` — drives the Kelola Dompet per-wallet stat footer. */
export function getWalletMonthlyNet(
  transactionList: Transaction[],
  walletId: string,
  referenceDate: Date
): WalletMonthlyNet {
  const monthly = transactionList.filter(
    (t) => t.walletId === walletId && isSameMonth(t.timestamp, referenceDate)
  );
  const net = monthly.reduce((sum, t) => sum + (t.direction === "income" ? t.amount : -t.amount), 0);
  return { count: monthly.length, net };
}

export interface CategoryMonthlyStat {
  categoryId: string;
  count: number;
  amount: number;
}

/** Per-category transaction count + total for one direction in the calendar month of `referenceDate` — drives the Kelola Kategori screen's real (non-fabricated) per-category stats. */
export function getCategoryMonthlyStats(
  transactionList: Transaction[],
  direction: TransactionDirection,
  referenceDate: Date
): CategoryMonthlyStat[] {
  const byCategory = new Map<string, CategoryMonthlyStat>();
  for (const t of transactionList) {
    if (t.direction !== direction || !isSameMonth(t.timestamp, referenceDate)) continue;
    const entry = byCategory.get(t.categoryId);
    if (entry) {
      entry.count += 1;
      entry.amount += t.amount;
    } else {
      byCategory.set(t.categoryId, { categoryId: t.categoryId, count: 1, amount: t.amount });
    }
  }
  return Array.from(byCategory.values());
}

/** Display label for a wallet, e.g. "Dompet Utama (BCA)" for a bank wallet, "GoPay" for an e-wallet. */
export function getWalletDisplayLabel(wallet: Wallet): string {
  return wallet.type === "bank" && wallet.provider ? `${wallet.name} (${wallet.provider})` : wallet.name;
}

export interface TransactionDayGroup {
  /** yyyy-MM-dd, used for stable sorting. */
  dateKey: string;
  date: Date;
  transactions: Transaction[];
  /** income - expense for this day, drives the group header's amount color. */
  net: number;
}

/** Buckets transactions by calendar day, each bucket sorted newest-first, buckets sorted newest-day-first. */
export function groupTransactionsByDay(transactionList: Transaction[]): TransactionDayGroup[] {
  const byDay = new Map<string, Transaction[]>();

  for (const transaction of transactionList) {
    const date = new Date(transaction.timestamp);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
    const bucket = byDay.get(dateKey);
    if (bucket) bucket.push(transaction);
    else byDay.set(dateKey, [transaction]);
  }

  const groups: TransactionDayGroup[] = Array.from(byDay.entries()).map(([dateKey, txs]) => {
    const sorted = [...txs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const net = sorted.reduce(
      (sum, t) => sum + (t.direction === "income" ? t.amount : -t.amount),
      0
    );
    return { dateKey, date: new Date(sorted[0].timestamp), transactions: sorted, net };
  });

  return groups.sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
}
