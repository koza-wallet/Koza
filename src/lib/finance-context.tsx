"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { transactions as initialTransactions, wallets as initialWallets } from "./mock-data";
import type { Transaction, TransactionDirection, Wallet } from "./types";

interface FinanceState {
  wallets: Wallet[];
  transactions: Transaction[];
}

export interface NewTransactionInput {
  title: string;
  category: string;
  categoryIcon: string;
  direction: TransactionDirection;
  amount: number;
  walletId: string;
  timestamp: string;
}

type FinanceAction = { type: "ADD_TRANSACTION"; payload: NewTransactionInput };

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
    default:
      return state;
  }
}

interface FinanceContextValue {
  wallets: Wallet[];
  transactions: Transaction[];
  addTransaction: (input: NewTransactionInput) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

/**
 * Single source of truth for dummy wallet balances + transactions, shared
 * across screens via Context so a transaction saved on "Catat Transaksi"
 * immediately reflects in Beranda's balance/summary without prop drilling
 * or a separate data-fetch layer (there's no backend yet).
 */
export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    wallets: initialWallets,
    transactions: initialTransactions,
  });

  const value = useMemo<FinanceContextValue>(
    () => ({
      wallets: state.wallets,
      transactions: state.transactions,
      addTransaction: (input) => dispatch({ type: "ADD_TRANSACTION", payload: input }),
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
