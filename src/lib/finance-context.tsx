"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { transactions as initialTransactions, wallets as initialWallets } from "./mock-data";
import type { Transaction, TransactionDirection, Wallet, WalletType } from "./types";

/** Bumped to v2: `Transaction` gained `categoryId`/`walletId`/`note` and `Wallet` CRUD landed — old v1 snapshots predate those fields, so they're deliberately not loaded (falls back to the fresh default dataset instead of a partial/stale shape). */
const STORAGE_KEY = "koza.finance-state.v2";

interface FinanceState {
  wallets: Wallet[];
  transactions: Transaction[];
}

const defaultState: FinanceState = {
  wallets: initialWallets,
  transactions: initialTransactions,
};

export interface NewTransactionInput {
  title: string;
  categoryId: string;
  category: string;
  categoryIcon: string;
  direction: TransactionDirection;
  amount: number;
  walletId: string;
  note?: string;
  timestamp: string;
}

export interface UpdateTransactionInput extends NewTransactionInput {
  id: string;
}

export interface NewWalletInput {
  name: string;
  type: WalletType;
  provider?: string;
  accountNumberMasked?: string;
  balance: number;
}

export interface UpdateWalletInput {
  id: string;
  name: string;
  provider?: string;
  accountNumberMasked?: string;
}

type FinanceAction =
  | { type: "ADD_TRANSACTION"; payload: NewTransactionInput }
  | { type: "UPDATE_TRANSACTION"; payload: UpdateTransactionInput }
  | { type: "DELETE_TRANSACTION"; payload: { id: string } }
  | { type: "ADD_WALLET"; payload: NewWalletInput }
  | { type: "UPDATE_WALLET"; payload: UpdateWalletInput }
  | { type: "DELETE_WALLET"; payload: { id: string } }
  | { type: "HYDRATE"; payload: FinanceState }
  | { type: "RESET" };

function paymentMethodForWallet(wallet: Wallet): string {
  if (wallet.type === "bank") return `${wallet.provider ?? wallet.name} Transfer`;
  if (wallet.type === "ewallet") return wallet.provider ?? wallet.name;
  return "Tunai";
}

function signedAmount(direction: TransactionDirection, amount: number): number {
  return direction === "income" ? amount : -amount;
}

/** Applies a balance delta to one wallet by id; no-ops when `walletId` is undefined (a legacy transaction with no resolvable source wallet) so we never guess which balance to touch. */
function applyWalletDelta(wallets: Wallet[], walletId: string | undefined, delta: number): Wallet[] {
  if (!walletId || delta === 0) return wallets;
  return wallets.map((w) => (w.id === walletId ? { ...w, balance: w.balance + delta } : w));
}

function reducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case "ADD_TRANSACTION": {
      const wallet = state.wallets.find((w) => w.id === action.payload.walletId);
      if (!wallet) return state;

      const { direction, amount } = action.payload;
      const transaction: Transaction = {
        id: `trx-${Date.now()}`,
        title: action.payload.title,
        categoryId: action.payload.categoryId,
        category: action.payload.category,
        categoryIcon: action.payload.categoryIcon,
        direction,
        amount,
        paymentMethod: paymentMethodForWallet(wallet),
        walletId: wallet.id,
        note: action.payload.note,
        timestamp: action.payload.timestamp,
      };

      return {
        transactions: [transaction, ...state.transactions],
        wallets: applyWalletDelta(state.wallets, wallet.id, signedAmount(direction, amount)),
      };
    }
    case "UPDATE_TRANSACTION": {
      const existing = state.transactions.find((t) => t.id === action.payload.id);
      if (!existing) return state;
      const newWallet = state.wallets.find((w) => w.id === action.payload.walletId);
      if (!newWallet) return state;

      // Two independent steps — reverse the transaction's old effect (from
      // whichever wallet it originally belonged to), then apply its new
      // effect (to whichever wallet it belongs to now) — so an edit that
      // changes the amount, direction, and/or source wallet all at once
      // still leaves every wallet's balance exactly reconciled.
      let wallets = applyWalletDelta(
        state.wallets,
        existing.walletId,
        -signedAmount(existing.direction, existing.amount)
      );
      wallets = applyWalletDelta(
        wallets,
        newWallet.id,
        signedAmount(action.payload.direction, action.payload.amount)
      );

      const updated: Transaction = {
        ...existing,
        title: action.payload.title,
        categoryId: action.payload.categoryId,
        category: action.payload.category,
        categoryIcon: action.payload.categoryIcon,
        direction: action.payload.direction,
        amount: action.payload.amount,
        paymentMethod: paymentMethodForWallet(newWallet),
        walletId: newWallet.id,
        note: action.payload.note,
        timestamp: action.payload.timestamp,
      };

      return {
        wallets,
        transactions: state.transactions.map((t) => (t.id === existing.id ? updated : t)),
      };
    }
    case "DELETE_TRANSACTION": {
      const existing = state.transactions.find((t) => t.id === action.payload.id);
      if (!existing) return state;

      const wallets = applyWalletDelta(
        state.wallets,
        existing.walletId,
        -signedAmount(existing.direction, existing.amount)
      );

      return {
        wallets,
        transactions: state.transactions.filter((t) => t.id !== existing.id),
      };
    }
    case "ADD_WALLET": {
      const wallet: Wallet = {
        id: `wallet-${Date.now()}`,
        name: action.payload.name,
        type: action.payload.type,
        provider: action.payload.provider,
        accountNumberMasked: action.payload.accountNumberMasked,
        balance: action.payload.balance,
      };
      return { ...state, wallets: [...state.wallets, wallet] };
    }
    case "UPDATE_WALLET": {
      // Deliberately doesn't accept `balance` — a wallet's balance should
      // only ever move via a transaction (ADD/UPDATE/DELETE_TRANSACTION), so
      // it always stays reconciled with the transaction log instead of being
      // silently overwritable from an edit form.
      return {
        ...state,
        wallets: state.wallets.map((w) =>
          w.id === action.payload.id
            ? {
                ...w,
                name: action.payload.name,
                provider: action.payload.provider,
                accountNumberMasked: action.payload.accountNumberMasked,
              }
            : w
        ),
      };
    }
    case "DELETE_WALLET": {
      // Guard: refuse to delete a wallet that still has transaction history —
      // that would orphan `walletId` references and silently break future
      // balance edits/deletes for those transactions.
      const hasHistory = state.transactions.some((t) => t.walletId === action.payload.id);
      if (hasHistory) return state;
      return { ...state, wallets: state.wallets.filter((w) => w.id !== action.payload.id) };
    }
    case "HYDRATE":
      return action.payload;
    case "RESET":
      return defaultState;
    default:
      return state;
  }
}

/** Narrow check that parsed localStorage JSON has the shape we expect, so corrupted or foreign data can't crash the app — falls back to defaults instead. */
function isFinanceState(value: unknown): value is FinanceState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<FinanceState>;
  return Array.isArray(candidate.wallets) && Array.isArray(candidate.transactions);
}

interface FinanceContextValue {
  wallets: Wallet[];
  transactions: Transaction[];
  addTransaction: (input: NewTransactionInput) => void;
  updateTransaction: (input: UpdateTransactionInput) => void;
  deleteTransaction: (id: string) => void;
  addWallet: (input: NewWalletInput) => void;
  updateWallet: (input: UpdateWalletInput) => void;
  deleteWallet: (id: string) => void;
  /** Wipes any saved data and restores the original dummy dataset — used by the Profil screen's "Reset ke Data Awal". */
  resetToDefault: () => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

/**
 * Single source of truth for wallet balances + transactions, shared across
 * screens via Context, and auto-saved to localStorage so data survives a
 * reload/browser restart without a backend.
 *
 * localStorage is only ever touched inside `useEffect` (never during render),
 * so the server-rendered HTML and the client's first render both start from
 * the same `defaultState` — no hydration mismatch. A saved snapshot, if any,
 * is applied via HYDRATE right after mount, once it's safe to read `window`.
 */
export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  // Skips the persist effect's very first run (mount, still holding
  // `defaultState`) so it never overwrites a saved snapshot the load effect
  // below is about to apply via HYDRATE — a ref, not state, since nothing
  // here needs to trigger a re-render.
  const skipNextPersistRef = useRef(true);

  // Load a saved snapshot once, after mount (client-only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isFinanceState(parsed)) {
          dispatch({ type: "HYDRATE", payload: parsed });
        }
      }
    } catch {
      // Corrupted JSON or storage unavailable (private mode, disabled) — keep defaults.
    }
  }, []);

  // Persist every change to localStorage, skipping only the initial mount run.
  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable (quota, private mode) — app keeps working in-memory.
    }
  }, [state]);

  const value = useMemo<FinanceContextValue>(
    () => ({
      wallets: state.wallets,
      transactions: state.transactions,
      addTransaction: (input) => dispatch({ type: "ADD_TRANSACTION", payload: input }),
      updateTransaction: (input) => dispatch({ type: "UPDATE_TRANSACTION", payload: input }),
      deleteTransaction: (id) => dispatch({ type: "DELETE_TRANSACTION", payload: { id } }),
      addWallet: (input) => dispatch({ type: "ADD_WALLET", payload: input }),
      updateWallet: (input) => dispatch({ type: "UPDATE_WALLET", payload: input }),
      deleteWallet: (id) => dispatch({ type: "DELETE_WALLET", payload: { id } }),
      resetToDefault: () => dispatch({ type: "RESET" }),
    }),
    [state]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within a FinanceProvider");
  return ctx;
}
