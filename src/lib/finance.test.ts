import { describe, it, expect } from "vitest";
import { getTotalBalance, isSameMonth, getMonthlySummary, groupTransactionsByDay } from "./finance";
import type { Wallet, Transaction } from "./types";

describe("finance.ts", () => {
  it("getTotalBalance - menghitung total saldo dari daftar dompet", () => {
    const wallets: Wallet[] = [
      { id: "1", name: "Dompet 1", type: "bank", balance: 5000 },
      { id: "2", name: "Dompet 2", type: "cash", balance: 10000 },
    ];
    expect(getTotalBalance(wallets)).toBe(15000);
    expect(getTotalBalance([])).toBe(0);
  });

  it("isSameMonth - membandingkan dua tanggal pada bulan dan tahun yang sama", () => {
    const ref = new Date("2026-07-20T10:00:00Z");
    expect(isSameMonth("2026-07-01T00:00:00Z", ref)).toBe(true);
    expect(isSameMonth("2026-08-01T00:00:00Z", ref)).toBe(false);
    expect(isSameMonth("2025-07-20T00:00:00Z", ref)).toBe(false);
  });

  it("getMonthlySummary - menghitung total pemasukan dan pengeluaran dalam satu bulan", () => {
    const txs: Transaction[] = [
      { id: "1", title: "A", categoryId: "1", category: "Cat1", categoryIcon: "icon", direction: "income", amount: 10000, timestamp: "2026-07-10T10:00:00Z", paymentMethod: "Cash" },
      { id: "2", title: "B", categoryId: "2", category: "Cat2", categoryIcon: "icon", direction: "expense", amount: 3000, timestamp: "2026-07-15T10:00:00Z", paymentMethod: "Cash" },
      { id: "3", title: "C", categoryId: "2", category: "Cat2", categoryIcon: "icon", direction: "expense", amount: 2000, timestamp: "2026-06-15T10:00:00Z", paymentMethod: "Cash" }, // Beda bulan
    ];
    
    const summary = getMonthlySummary(txs, new Date("2026-07-20T10:00:00Z"));
    expect(summary.income).toBe(10000);
    expect(summary.incomeCount).toBe(1);
    expect(summary.expense).toBe(3000); // Tx 3 tidak dihitung karena beda bulan
    expect(summary.expenseCount).toBe(1);
    expect(summary.net).toBe(7000);
  });

  it("groupTransactionsByDay - mengelompokkan transaksi per hari", () => {
    const txs: Transaction[] = [
      { id: "1", title: "A", categoryId: "1", category: "Cat", categoryIcon: "icon", direction: "income", amount: 1000, timestamp: "2026-07-20T15:00:00Z", paymentMethod: "Cash" },
      { id: "2", title: "B", categoryId: "1", category: "Cat", categoryIcon: "icon", direction: "expense", amount: 500, timestamp: "2026-07-20T10:00:00Z", paymentMethod: "Cash" },
      { id: "3", title: "C", categoryId: "1", category: "Cat", categoryIcon: "icon", direction: "expense", amount: 200, timestamp: "2026-07-19T10:00:00Z", paymentMethod: "Cash" },
    ];
    
    const groups = groupTransactionsByDay(txs);
    expect(groups).toHaveLength(2);
    expect(groups[0].dateKey).toBe("2026-07-20");
    expect(groups[0].net).toBe(500); // 1000 - 500
    expect(groups[0].transactions).toHaveLength(2);
    expect(groups[1].dateKey).toBe("2026-07-19");
    expect(groups[1].net).toBe(-200); // -200
  });
});
