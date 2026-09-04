import type { Transaction, Wallet } from "./types";

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
