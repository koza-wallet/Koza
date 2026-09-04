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
import type { Transaction, TransactionDirection, Wallet } from "./types";

/** Bump this suffix if `FinanceState`'s shape ever changes in a way old saved data wouldn't match. */
const STORAGE_KEY = "koza.finance-state.v1";

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
  category: string;
  categoryIcon: string;
  direction: TransactionDirection;
  amount: number;
  walletId: string;
  timestamp: string;
}

type FinanceAction =
  | { type: "ADD_TRANSACTION"; payload: NewTransactionInput }
  | { type: "HYDRATE"; payload: FinanceState }
  | { type: "RESET" };

function paymentMethodForWallet(wallet: Wallet): string {
  if (wallet.type === "bank") return `${wallet.provider ?? wallet.name} Transfer`;
  if (wallet.type === "ewallet") return wallet.provider ?? wallet.name;
  return "Tunai";
}

function reducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case "ADD_TRANSACTION": {
      const wallet = state.wallets.find((w) => w.id === action.payload.walletId);
      if (!wallet) return state;

      const { direction, amount } = action.payload;
      const balanceDelta = direction === "income" ? amount : -amount;

      const transaction: Transaction = {
        id: `trx-${Date.now()}`,
        title: action.payload.title,
        category: action.payload.category,
        categoryIcon: action.payload.categoryIcon,
        direction,
        amount,
        paymentMethod: paymentMethodForWallet(wallet),
        timestamp: action.payload.timestamp,
      };

      return {
        transactions: [transaction, ...state.transactions],
        wallets: state.wallets.map((w) =>
          w.id === wallet.id ? { ...w, balance: w.balance + balanceDelta } : w
        ),
      };
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
