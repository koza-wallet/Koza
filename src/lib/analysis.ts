import type { Transaction, Wallet } from "./types";

export interface HealthScoreResult {
  totalScore: number;
  cashflow: { score: number; max: number; label: string; tip: string };
  savings: { score: number; max: number; label: string; tip: string };
  debt: { score: number; max: number; label: string; tip: string };
  pocket: { score: number; max: number; label: string; tip: string };
  overallTip: string;
}

export function calculateHealthScore(
  transactions: Transaction[],
  wallets: Wallet[], // Not strictly needed for logic but good for future expansions
  activePocketsCount: number = 0 // Mocked for now until Pockets context is fully hooked
): HealthScoreResult {
  // Hanya ambil transaksi bulan ini (untuk relevansi)
  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.timestamp);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  let totalIncome = 0;
  let totalExpense = 0;
  let totalDebtPayment = 0;

  currentMonthTransactions.forEach((t) => {
    if (t.direction === "income") {
      totalIncome += t.amount;
    } else if (t.direction === "expense") {
      totalExpense += t.amount;
      // Deteksi pembayaran hutang dari kategori
      if (t.categoryId === "bayar_hutang" || (t.category && t.category.toLowerCase().includes("hutang"))) {
        totalDebtPayment += t.amount;
      }
    }
  });

  // 1. CASHFLOW (Maks 30)
  let cashflowScore = 0;
  let cashflowLabel = "Kas Defisit";
  let cashflowTip = "Pengeluaran Anda melebihi pemasukan. Kurangi pengeluaran tersier.";
  if (totalIncome > totalExpense) {
    cashflowScore = 30;
    cashflowLabel = "Arus Kas Positif";
    cashflowTip = "Bagus! Anda memiliki sisa uang di akhir bulan.";
  } else if (totalIncome === totalExpense && totalIncome > 0) {
    cashflowScore = 15;
    cashflowLabel = "Kas Pas-pasan";
    cashflowTip = "Pemasukan dan pengeluaran seimbang. Coba hemat sedikit lagi.";
  }

  // 2. SAVINGS RATE (Maks 30)
  let savingsScore = 0;
  let savingsLabel = "Tidak Menabung";
  let savingsTip = "Anda belum menyisihkan uang untuk ditabung bulan ini.";
  const netSavings = totalIncome - totalExpense;
  if (totalIncome > 0 && netSavings > 0) {
    const savingsRate = netSavings / totalIncome;
    if (savingsRate > 0.20) {
      savingsScore = 30;
      savingsLabel = "Luar Biasa (>20%)";
      savingsTip = "Anda berhasil menabung lebih dari 20% pemasukan. Pertahankan!";
    } else if (savingsRate >= 0.10) {
      savingsScore = 20;
      savingsLabel = "Baik (10-20%)";
      savingsTip = "Tingkat tabungan Anda sehat. Jika bisa, tingkatkan pelan-pelan.";
    } else {
      savingsScore = 10;
      savingsLabel = "Kurang (<10%)";
      savingsTip = "Ada sedikit uang sisa, tapi rasionya sangat kecil. Kurangi jajan kopi.";
    }
  }

  // 3. DEBT BURDEN (Maks 20)
  let debtScore = 20;
  let debtLabel = "Bebas Hutang";
  let debtTip = "Sempurna! Anda tidak memiliki beban cicilan hutang bulan ini.";
  if (totalIncome > 0 && totalDebtPayment > 0) {
    const debtRatio = totalDebtPayment / totalIncome;
    if (debtRatio < 0.3) {
      debtScore = 15;
      debtLabel = "Aman (<30%)";
      debtTip = "Cicilan hutang Anda masih dalam batas aman perbankan.";
    } else if (debtRatio <= 0.5) {
      debtScore = 5;
      debtLabel = "Waspada (30-50%)";
      debtTip = "Peringatan: Hampir separuh uang Anda habis untuk membayar hutang.";
    } else {
      debtScore = 0;
      debtLabel = "Berbahaya (>50%)";
      debtTip = "Bahaya! Beban hutang Anda sangat tinggi. Segera lunasi yang bunganya terbesar.";
    }
  }

  // 4. POCKETS ALLOCATION (Maks 20)
  let pocketScore = 0;
  let pocketLabel = "Belum Ada Simpanan";
  let pocketTip = "Gunakan fitur 'Kantong' untuk memisahkan uang darurat/impian Anda.";
  if (activePocketsCount > 0) {
    pocketScore = 20;
    pocketLabel = "Kantong Aktif";
    pocketTip = "Bagus sekali Anda sudah menggunakan Kantong untuk merencanakan masa depan.";
  }

  // JIKA TIDAK ADA DATA SAMA SEKALI
  if (totalIncome === 0 && totalExpense === 0) {
    return {
      totalScore: 0,
      cashflow: { score: 0, max: 30, label: "Belum Ada Data", tip: "Catat transaksi pertama Anda!" },
      savings: { score: 0, max: 30, label: "-", tip: "-" },
      debt: { score: 0, max: 20, label: "-", tip: "-" },
      pocket: { score: 0, max: 20, label: "-", tip: "-" },
      overallTip: "Yuk mulai catat pemasukan dan pengeluaran Anda hari ini."
    };
  }

  const totalScore = cashflowScore + savingsScore + debtScore + pocketScore;
  
  let overallTip = "";
  if (totalScore >= 80) overallTip = "Kondisi finansial Anda sangat sehat! Anda sudah di jalur yang tepat menuju kebebasan finansial.";
  else if (totalScore >= 50) overallTip = "Kondisi finansial Anda cukup stabil, tapi masih ada ruang untuk perbaikan. Perhatikan saran di bawah.";
  else overallTip = "Kondisi finansial Anda sedang tidak sehat. Waktunya evaluasi ulang anggaran Anda secara menyeluruh.";

  return {
    totalScore,
    cashflow: { score: cashflowScore, max: 30, label: cashflowLabel, tip: cashflowTip },
    savings: { score: savingsScore, max: 30, label: savingsLabel, tip: savingsTip },
    debt: { score: debtScore, max: 20, label: debtLabel, tip: debtTip },
    pocket: { score: pocketScore, max: 20, label: pocketLabel, tip: pocketTip },
    overallTip,
  };
}
