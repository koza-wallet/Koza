export type TransactionDirection = "income" | "expense";

export interface Transaction {
  id: string;
  title: string;
  /** Matches a `CategoryOption.id` in categories.ts — the source of truth for editing; `category`/`categoryIcon` below are a denormalized display snapshot. */
  categoryId: string;
  category: string;
  categoryIcon: string;
  direction: TransactionDirection;
  amount: number;
  paymentMethod: string;
  /**
   * Matches a `Wallet.id`. Optional because the original seed dataset predates
   * per-transaction wallet linking — those entries stay unresolved rather than
   * guessing a wallet, so their balance is never touched on edit/delete.
   */
  walletId?: string;
  /** Free-text note, only set when the user actually typed one in "Catatan (opsional)". */
  note?: string;
  /** ISO 8601 timestamp, e.g. "2026-07-20T12:30:00+07:00" */
  timestamp: string;
}

export type WalletType = "bank" | "cash" | "ewallet";

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  provider?: string;
  accountNumberMasked?: string;
  balance: number;
}

export interface UserProfile {
  name: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  healthScore: number;
  /** ISO 8601 date the user joined, e.g. "2026-01-01" */
  memberSince: string;
}
