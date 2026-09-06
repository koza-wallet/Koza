"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { transactions as initialTransactions, wallets as initialWallets } from "./mock-data";
import type { Transaction, TransactionDirection, Wallet, WalletType } from "./types";
import { 
  getFinanceData, 
  addWalletAction, 
  deleteWalletAction, 
  addTransactionAction, 
  deleteTransactionAction 
} from "@/actions/finance";

interface FinanceState {
  wallets: Wallet[];
  transactions: Transaction[];
}

const defaultState: FinanceState = {
  wallets: [],
  transactions: [],
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
  currencyCode?: string;
  exchangeRate?: number;
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
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: { id: string, previousWalletId?: string, amount: number, direction: string } }
  | { type: "ADD_WALLET"; payload: Wallet }
  | { type: "UPDATE_WALLET"; payload: UpdateWalletInput }
  | { type: "DELETE_WALLET"; payload: { id: string } }
  | { type: "HYDRATE"; payload: FinanceState }
  | { type: "RESET" };

function paymentMethodForWallet(wallet: Wallet): string {
  if (wallet.type === "bank") return `${wallet.provider ?? wallet.name} Transfer`;
  if (wallet.type === "ewallet") return wallet.provider ?? wallet.name;
  return "Tunai";
}

function signedAmount(direction: string, amount: number): number {
  return direction === "income" ? amount : -amount;
}

function applyWalletDelta(wallets: Wallet[], walletId: string | undefined, delta: number): Wallet[] {
  if (!walletId || delta === 0) return wallets;
  return wallets.map((w) => (w.id === walletId ? { ...w, balance: w.balance + delta } : w));
}

function reducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case "ADD_TRANSACTION": {
      const wallet = state.wallets.find((w) => w.id === action.payload.walletId);
      if (!wallet) return state;
      return {
        transactions: [action.payload, ...state.transactions],
        wallets: applyWalletDelta(state.wallets, wallet.id, signedAmount(action.payload.direction, action.payload.amount)),
      };
    }
    case "UPDATE_TRANSACTION": {
      // Simplification for the mock update
      return { ...state };
    }
    case "DELETE_TRANSACTION": {
      const wallets = applyWalletDelta(
        state.wallets,
        action.payload.previousWalletId,
        -signedAmount(action.payload.direction, action.payload.amount)
      );
      return {
        wallets,
        transactions: state.transactions.filter((t) => t.id !== action.payload.id),
      };
    }
    case "ADD_WALLET": {
      return { ...state, wallets: [...state.wallets, action.payload] };
    }
    case "UPDATE_WALLET": {
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

interface FinanceContextValue {
  wallets: Wallet[];
  transactions: Transaction[];
  isLoading: boolean;
  addTransaction: (input: NewTransactionInput) => Promise<void>;
  updateTransaction: (input: UpdateTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addWallet: (input: NewWalletInput) => Promise<void>;
  updateWallet: (input: UpdateWalletInput) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  resetToDefault: () => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from Supabase via Next.js Server Actions
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFinanceData();
        
        const formattedTransactions: Transaction[] = data.transactions.map((t: any) => ({
          id: t.id,
          title: t.title,
          amount: t.amount,
          direction: t.direction as TransactionDirection,
          walletId: t.walletId,
          categoryId: t.categoryId,
          category: t.categoryId, // Simplification
          categoryIcon: "category",
          paymentMethod: t.paymentMethod,
          note: t.note || undefined,
          timestamp: t.date.toISOString(),
        }));

        const formattedWallets: Wallet[] = data.wallets.map((w: any) => {
          // Hitung saldo berdasarkan transaksi
          const walletTransactions = formattedTransactions.filter(t => t.walletId === w.id);
          const balance = walletTransactions.reduce((acc, t) => {
            return t.direction === "income" ? acc + t.amount : acc - t.amount;
          }, 0);

          return {
            id: w.id,
            name: w.name,
            type: "cash", // Fallback, could map from icon
            provider: w.icon,
            balance: balance
          };
        });

        dispatch({ type: "HYDRATE", payload: { wallets: formattedWallets, transactions: formattedTransactions } });
      } catch (e) {
        console.error("Failed to load data from server", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      wallets: state.wallets,
      transactions: state.transactions,
      isLoading,
      addTransaction: async (input) => {
        try {
          const newTrx = await addTransactionAction(input);
          // Optimitic Update or refetch
          const formatted: Transaction = {
            id: newTrx.id,
            title: newTrx.title,
            amount: newTrx.amount,
            direction: newTrx.direction as TransactionDirection,
            walletId: newTrx.walletId,
            categoryId: newTrx.categoryId,
            category: input.category,
            categoryIcon: input.categoryIcon,
            paymentMethod: newTrx.paymentMethod,
            note: newTrx.note || undefined,
            timestamp: newTrx.date.toISOString(),
          };
          dispatch({ type: "ADD_TRANSACTION", payload: formatted });
        } catch (e) {
          console.error(e);
        }
      },
      updateTransaction: async (input) => {
        console.log("Update not fully implemented on server yet", input);
      },
      deleteTransaction: async (id) => {
        const existing = state.transactions.find((t) => t.id === id);
        if (!existing) return;
        try {
          await deleteTransactionAction(id);
          dispatch({ 
            type: "DELETE_TRANSACTION", 
            payload: { 
              id, 
              previousWalletId: existing.walletId, 
              amount: existing.amount, 
              direction: existing.direction 
            } 
          });
        } catch(e) {
          console.error(e);
        }
      },
      addWallet: async (input) => {
        try {
          const dbWallet = await addWalletAction(input);
          dispatch({ type: "ADD_WALLET", payload: { 
            id: dbWallet.id, 
            name: dbWallet.name, 
            type: input.type, 
            provider: input.provider, 
            balance: input.balance 
          } });
        } catch (e) {
          console.error(e);
        }
      },
      updateWallet: async (input) => {
        // Mocked
        dispatch({ type: "UPDATE_WALLET", payload: input });
      },
      deleteWallet: async (id) => {
        try {
          await deleteWalletAction(id);
          dispatch({ type: "DELETE_WALLET", payload: { id } });
        } catch (e) {
          console.error(e);
        }
      },
      resetToDefault: () => dispatch({ type: "RESET" }),
    }),
    [state, isLoading]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within a FinanceProvider");
  return ctx;
}
