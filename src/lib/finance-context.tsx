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
import { getCategoryById } from "@/lib/categories";

interface FinanceState {
  wallets: Wallet[];
  transactions: Transaction[];
  customCategories: any[];
  debts: any[];
  pockets: any[];
}

const defaultState: FinanceState = {
  wallets: [],
  transactions: [],
  customCategories: [],
  debts: [],
  pockets: [],
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

export interface NewCategoryInput {
  name: string;
  fullName: string;
  icon: string;
  bg: string;
  text: string;
  type: string;
}

export interface NewDebtInput {
  type: "HUTANG" | "PIUTANG";
  contactName: string;
  amount: number;
  walletId: string;
  date: string;
}

type FinanceAction =
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: { id: string, previousWalletId?: string, amount: number, direction: string } }
  | { type: "ADD_WALLET"; payload: Wallet }
  | { type: "UPDATE_WALLET"; payload: UpdateWalletInput }
  | { type: "DELETE_WALLET"; payload: { id: string } }
  | { type: "ADD_CATEGORY"; payload: any }
  | { type: "ADD_DEBT"; payload: any }
  | { type: "PAY_DEBT"; payload: { transaction: Transaction, updatedDebt: any } }
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
        ...state,
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
        ...state,
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
    case "ADD_CATEGORY": {
      return { ...state, customCategories: [...state.customCategories, action.payload] };
    }
    case "ADD_DEBT": {
      return { ...state, debts: [action.payload, ...state.debts] };
    }
    case "PAY_DEBT": {
      const wallet = state.wallets.find((w) => w.id === action.payload.transaction.walletId);
      const wallets = wallet 
        ? applyWalletDelta(state.wallets, wallet.id, signedAmount(action.payload.transaction.direction, action.payload.transaction.amount))
        : state.wallets;
        
      return { 
        ...state, 
        transactions: [action.payload.transaction, ...state.transactions],
        wallets,
        debts: state.debts.map(d => d.id === action.payload.updatedDebt.id ? action.payload.updatedDebt : d)
      };
    }
    case "HYDRATE":
      return {
        ...state,
        ...action.payload
      };
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
  addDebt: (input: NewDebtInput) => Promise<void>;
  payDebt: (input: { debtId: string, amount: number, walletId: string, date: string }) => Promise<void>;
  addCustomCategory: (input: NewCategoryInput) => Promise<void>;
  customCategories: any[];
  debts: any[];
  pockets: any[];
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
        
        const customCategories = data.customCategories || [];
        const debts = data.debts || [];
        const pockets = data.pockets || [];

        const formattedTransactions: Transaction[] = data.transactions.map((t: any) => {
          let cat = getCategoryById(t.categoryId);
          if (cat.id !== t.categoryId) {
            const match = customCategories.find((c: any) => c.id === t.categoryId);
            if (match) {
              cat = match as any;
            }
          }
          return {
            id: t.id,
            title: t.title,
            amount: t.amount,
            direction: t.direction as TransactionDirection,
            walletId: t.walletId,
            categoryId: t.categoryId,
            category: cat.fullName,
            categoryIcon: cat.icon,
            paymentMethod: t.paymentMethod,
            note: t.note || undefined,
            timestamp: new Date(t.date).toISOString(),
          };
        });

        const formattedWallets: Wallet[] = data.wallets.map((w: any) => {
          const walletTransactions = formattedTransactions.filter(t => t.walletId === w.id);
          const balance = walletTransactions.reduce((acc, t) => {
            return t.direction === "income" ? acc + t.amount : acc - t.amount;
          }, 0);

          return {
            id: w.id,
            name: w.name,
            type: "cash", 
            provider: w.icon,
            balance: balance
          };
        });
        dispatch({ type: "HYDRATE", payload: { wallets: formattedWallets, transactions: formattedTransactions, customCategories, debts, pockets } });
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
      customCategories: state.customCategories,
      debts: state.debts,
      pockets: state.pockets,
      isLoading,
      addTransaction: async (input) => {
        try {
          const dbTransaction = await addTransactionAction(input);
          
          let cat = getCategoryById(dbTransaction.categoryId);
          if (cat.id !== dbTransaction.categoryId) {
            const match = state.customCategories.find((c: any) => c.id === dbTransaction.categoryId);
            if (match) cat = match as any;
          }

          const formatted: Transaction = {
            id: dbTransaction.id,
            title: dbTransaction.title,
            amount: dbTransaction.amount,
            direction: dbTransaction.direction as TransactionDirection,
            walletId: dbTransaction.walletId,
            categoryId: dbTransaction.categoryId,
            category: cat.fullName,
            categoryIcon: cat.icon,
            paymentMethod: dbTransaction.paymentMethod,
            note: dbTransaction.note || undefined,
            timestamp: dbTransaction.date.toISOString(),
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
      addDebt: async (input) => {
        try {
          const { addDebtAction } = await import("@/actions/finance");
          const { transaction: newTrx } = await addDebtAction({
            type: input.type,
            contactName: input.contactName,
            amount: input.amount,
            walletId: input.walletId,
            date: input.date
          });
          
          const formatted: Transaction = {
            id: newTrx.id,
            title: newTrx.title,
            amount: newTrx.amount,
            direction: newTrx.direction as TransactionDirection,
            walletId: newTrx.walletId,
            categoryId: newTrx.categoryId,
            category: input.type === "HUTANG" ? "Hutang" : "Piutang",
            categoryIcon: "handshake",
            paymentMethod: newTrx.paymentMethod,
            note: newTrx.note || undefined,
            timestamp: newTrx.date.toISOString(),
          };
          
          dispatch({ type: "ADD_TRANSACTION", payload: formatted });
        } catch (e) {
          console.error(e);
          throw e; 
        }
      },
      payDebt: async (input) => {
        try {
          const { payDebtAction } = await import("@/actions/finance");
          const { transaction: newTrx, updatedDebt } = await payDebtAction(input);
          
          const formatted: Transaction = {
            id: newTrx.id,
            title: newTrx.title,
            amount: newTrx.amount,
            direction: newTrx.direction as TransactionDirection,
            walletId: newTrx.walletId,
            categoryId: newTrx.categoryId,
            category: newTrx.categoryId === "bayar_hutang" ? "Bayar Hutang" : "Terima Piutang",
            categoryIcon: "payments",
            paymentMethod: newTrx.paymentMethod,
            note: newTrx.note || undefined,
            timestamp: newTrx.date.toISOString(),
          };
          
          dispatch({ type: "PAY_DEBT", payload: { transaction: formatted, updatedDebt } });
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      addCustomCategory: async (input) => {
        try {
          const { addCategoryAction } = await import("@/actions/finance");
          const dbCategory = await addCategoryAction(input);
          dispatch({ type: "ADD_CATEGORY", payload: dbCategory });
        } catch (e) {
          console.error(e);
          throw e;
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
