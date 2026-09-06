import { describe, it, expect } from "vitest";
import { getPeriodReport, shiftAnchor } from "./report";
import type { Transaction } from "./types";

describe("report.ts", () => {
  it("shiftAnchor - menggeser tanggal anchor sesuai granularitas", () => {
    const d = new Date("2026-07-20T10:00:00Z");
    
    // Harian: geser 1 hari
    const prevDay = shiftAnchor("harian", d, -1);
    expect(prevDay.getDate()).toBe(19);

    // Mingguan: geser 7 hari
    const prevWeek = shiftAnchor("mingguan", d, -1);
    expect(prevWeek.getDate()).toBe(13); // 20 - 7

    // Bulanan: geser 1 bulan
    const nextMonth = shiftAnchor("bulanan", d, 1);
    expect(nextMonth.getMonth()).toBe(7); // Agustus (0-indexed 7)
  });

  it("getPeriodReport - menghitung slice donat dan persentase dengan benar", () => {
    const txs: Transaction[] = [
      { id: "1", title: "A", categoryId: "1", category: "Makan", categoryIcon: "icon", direction: "expense", amount: 50000, timestamp: "2026-07-20T10:00:00Z", paymentMethod: "Cash" },
      { id: "2", title: "B", categoryId: "2", category: "Transport", categoryIcon: "icon", direction: "expense", amount: 30000, timestamp: "2026-07-19T10:00:00Z", paymentMethod: "Cash" },
      { id: "3", title: "C", categoryId: "3", category: "Hiburan", categoryIcon: "icon", direction: "expense", amount: 15000, timestamp: "2026-07-18T10:00:00Z", paymentMethod: "Cash" },
      { id: "4", title: "D", categoryId: "4", category: "Kesehatan", categoryIcon: "icon", direction: "expense", amount: 5000, timestamp: "2026-07-17T10:00:00Z", paymentMethod: "Cash" },
      { id: "5", title: "E", categoryId: "1", category: "Makan", categoryIcon: "icon", direction: "income", amount: 100000, timestamp: "2026-07-20T10:00:00Z", paymentMethod: "Cash" }, // income harus diabaikan untuk slice donat pengeluaran
    ];

    const report = getPeriodReport(txs, "bulanan", new Date("2026-07-20T10:00:00Z"));
    
    expect(report.expense).toBe(100000); // 50k + 30k + 15k + 5k
    expect(report.income).toBe(100000);
    
    // slices harus urut dari amount terbesar: Makan (50), Transport (30), Hiburan (15), Lainnya (Kesehatan 5k)
    expect(report.categorySlices).toHaveLength(4); // top 3 + 1 Lainnya
    
    expect(report.categorySlices[0].category).toBe("Makan");
    expect(report.categorySlices[0].amount).toBe(50000);
    expect(report.categorySlices[0].percentage).toBe(50); // 50/100
    
    expect(report.categorySlices[1].category).toBe("Transport");
    expect(report.categorySlices[2].category).toBe("Hiburan");
    
    expect(report.categorySlices[3].category).toBe("Lainnya");
    expect(report.categorySlices[3].amount).toBe(5000);
    expect(report.categorySlices[3].percentage).toBe(5); // 5/100
  });
});
