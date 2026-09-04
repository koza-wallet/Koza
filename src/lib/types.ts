export type TransactionDirection = "income" | "expense";

export interface Transaction {
  id: string;
  title: string;
  category: string;
  categoryIcon: string;
  direction: TransactionDirection;
  amount: number;
  paymentMethod: string;
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
  email: string;
  avatarUrl: string;
  healthScore: number;
}
