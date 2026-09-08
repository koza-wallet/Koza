"use server";

import { createClient } from "@/utils/supabase/server";
import type { NewTransactionInput, UpdateTransactionInput, NewWalletInput, UpdateWalletInput } from "@/lib/finance-context";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user?.email) throw new Error("Unauthorized");

  // Nama canonical dari Supabase: metadata full_name, atau prefix email
  const supabaseName = user.user_metadata?.full_name || user.email.split("@")[0];
  
  let dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  
  // Lazy Sync: Jika belum ada di Prisma (misal login langsung tanpa lewat callback)
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: supabaseName,
        image: user.user_metadata?.avatar_url,
      }
    });

    // Auto-Provisioning: Buat Dompet Utama otomatis untuk pengguna baru
    // (jalur ini hanya terpakai kalau user login tanpa lewat auth/callback,
    // mis. akun lama — pengguna baru sudah dapat dompetnya di auth/callback)
    await prisma.wallet.create({
      data: {
        name: "Dompet Utama",
        icon: "account_balance_wallet",
        type: "cash",
        ownerId: dbUser.id
      }
    });
  } else {
    // Selalu sync nama dari Supabase ke DB agar tidak ada nama mock yang tersisa
    // Dibungkus try-catch agar tidak menghalangi operasi lain jika sync gagal
    try {
      if (dbUser.name !== supabaseName) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { name: supabaseName }
        });
      }
    } catch (syncErr) {
      console.error("Name sync failed (non-critical):", syncErr);
    }
  }
  
  return dbUser;
}

export async function getFinanceData() {
  try {
    const user = await getSessionUser();
    let wallets = await prisma.wallet.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } }
        ]
      },
      include: { members: true },
      orderBy: { createdAt: "asc" }
    });
    
    // Auto-fix: pengaman untuk kasus lama (akun sebelum perbaikan ini) atau
    // pengguna yang sengaja menghapus dompet terakhirnya — dompet baru kini
    // sudah dibuat sekali di titik registrasi (auth/callback), jadi jalur ini
    // seharusnya jarang tereksekusi pada penggunaan normal.
    if (wallets.length === 0) {
      const defaultWallet = await prisma.wallet.create({
        data: {
          name: "Dompet Utama",
          icon: "account_balance_wallet",
          type: "cash",
          ownerId: user.id
        }
      });
      // Sesuaikan tipe agar memiliki properti members yang kosong
      wallets = [{ ...defaultWallet, members: [] }];
    }

    // Ambil semua ID dompet yang dapat diakses
    const accessibleWalletIds = wallets.map(w => w.id);

    const transactions = await prisma.transaction.findMany({
      where: { 
        OR: [
          { userId: user.id },
          { walletId: { in: accessibleWalletIds } }
        ]
      },
      orderBy: { date: "desc" }
    });

    const customCategories = await prisma.category.findMany({
      where: { userId: user.id }
    });

    const debts = await prisma.debt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    const pockets = await prisma.pocket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" }
    });

    return { wallets, transactions, customCategories, debts, pockets };
  } catch (error) {
    console.error("GET_FINANCE_DATA_ERROR", error);
    return { wallets: [], transactions: [], customCategories: [], debts: [], pockets: [] };
  }
}

/** Label dompet yang ditampilkan sebagai `paymentMethod` transaksi (bukan ID mentah). */
async function getWalletPaymentLabel(walletId: string): Promise<string> {
  const wallet = await prisma.wallet.findUnique({ where: { id: walletId }, select: { name: true } });
  return wallet?.name ?? "Dompet";
}

export async function addWalletAction(input: NewWalletInput) {
  const user = await getSessionUser();
  const newWallet = await prisma.wallet.create({
    data: {
      name: input.name,
      ownerId: user.id,
      icon: input.provider || input.type,
      type: input.type,
      provider: input.provider,
      accountNumberMasked: input.accountNumberMasked
    }
  });

  // Saldo awal dicatat sebagai transaksi "Saldo Awal", bukan kolom terpisah —
  // konsisten dengan model saldo yang selalu diturunkan dari total transaksi.
  if (input.balance && input.balance > 0) {
    await prisma.transaction.create({
      data: {
        title: "Saldo Awal",
        amount: input.balance,
        direction: "income",
        date: new Date(),
        paymentMethod: newWallet.name,
        walletId: newWallet.id,
        categoryId: "saldo_awal",
        userId: user.id
      }
    });
  }

  return newWallet;
}

export async function updateWalletAction(input: UpdateWalletInput) {
  const user = await getSessionUser();
  const updated = await prisma.wallet.update({
    where: { id: input.id, ownerId: user.id },
    data: {
      name: input.name,
      provider: input.provider,
      accountNumberMasked: input.accountNumberMasked,
      icon: input.provider || undefined
    }
  });
  return updated;
}

export async function deleteWalletAction(id: string) {
  const user = await getSessionUser();
  await prisma.wallet.delete({
    where: { id, ownerId: user.id }
  });
  return true;
}

export async function addTransactionAction(input: NewTransactionInput) {
  const user = await getSessionUser();
  const paymentMethod = await getWalletPaymentLabel(input.walletId);
  const transaction = await prisma.transaction.create({
    data: {
      title: input.title,
      amount: input.amount,
      direction: input.direction,
      date: new Date(input.timestamp),
      paymentMethod,
      note: input.note,
      walletId: input.walletId,
      categoryId: input.categoryId,
      userId: user.id,
      currencyCode: input.currencyCode || "IDR",
      exchangeRate: input.exchangeRate || 1.0
    }
  });
  return transaction;
}

export async function updateTransactionAction(input: UpdateTransactionInput) {
  const user = await getSessionUser();
  const paymentMethod = await getWalletPaymentLabel(input.walletId);
  const transaction = await prisma.transaction.update({
    where: { id: input.id, userId: user.id },
    data: {
      title: input.title,
      amount: input.amount,
      direction: input.direction,
      date: new Date(input.timestamp),
      paymentMethod,
      note: input.note,
      walletId: input.walletId,
      categoryId: input.categoryId,
      currencyCode: input.currencyCode || "IDR",
      exchangeRate: input.exchangeRate || 1.0
    }
  });
  return transaction;
}

export async function deleteTransactionAction(id: string) {
  const user = await getSessionUser();
  await prisma.transaction.delete({
    where: { id, userId: user.id }
  });
  return true;
}

export async function getPocketsAction() {
  const user = await getSessionUser();
  return prisma.pocket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }
  });
}

export async function addPocketAction(input: { name: string, targetAmount: number, color?: string, icon?: string }) {
  const user = await getSessionUser();
  return prisma.pocket.create({
    data: {
      name: input.name,
      targetAmount: input.targetAmount,
      color: input.color || "bg-primary",
      icon: input.icon || "savings",
      userId: user.id
    }
  });
}

export async function addPocketBalanceAction(id: string, amount: number) {
  const user = await getSessionUser();
  return prisma.pocket.update({
    where: { id, userId: user.id },
    data: { currentBalance: { increment: amount } }
  });
}

// === SHARED WALLET ACTIONS ===
export async function addWalletMemberAction(walletId: string, emailToInvite: string) {
  const user = await getSessionUser();
  
  // 1. Verifikasi pemilik dompet
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId, ownerId: user.id }
  });
  if (!wallet) throw new Error("Akses ditolak atau dompet tidak ditemukan");

  // 2. Cari user yang akan diundang
  const invitedUser = await prisma.user.findUnique({
    where: { email: emailToInvite }
  });
  if (!invitedUser) throw new Error("Pengguna dengan email tersebut tidak ditemukan");
  
  if (invitedUser.id === user.id) throw new Error("Anda tidak bisa mengundang diri sendiri");

  // 3. Tambahkan ke WalletMember
  return prisma.walletMember.create({
    data: {
      walletId,
      userId: invitedUser.id,
      role: "EDITOR" // Default izin edit transaksi
    }
  });
}

// === SUBSCRIPTION ACTIONS ===
export async function setSubscriptionTierAction(tier: string) {
  try {
    const user = await getSessionUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionTier: tier }
    });
    return { success: true };
  } catch (err: unknown) {
    console.error("[setSubscriptionTierAction] Error:", err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// === FETCH USER PROFILE DARI PRISMA ===
export async function getUserProfileAction() {
  const user = await getSessionUser();
  let tier = user.subscriptionTier;

  // Migrasi otomatis data lama "PRO" ke "PREMIUM"
  if (tier === "PRO") {
    tier = "PREMIUM";
    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionTier: "PREMIUM" }
    });
  }

  return {
    subscriptionTier: tier,
    exportCount: user.exportCount,
    isReminderOn: user.isReminderOn,
    email: user.email,
    name: user.name || user.email.split("@")[0]
  };
}

// === EXPORT ACTIONS ===
export async function incrementExportCountAction() {
  const user = await getSessionUser();
  
  if (user.subscriptionTier === "FREE" && user.exportCount >= 3) {
    return { error: "LIMIT_REACHED" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { exportCount: { increment: 1 } }
  });

  return { success: true };
}

// === DEBT ACTIONS ===
export async function addDebtAction(input: {
  type: "HUTANG" | "PIUTANG";
  contactName: string;
  amount: number;
  walletId: string;
  date: string;
}) {
  const user = await getSessionUser();
  
  // 1. Buat record Hutang/Piutang
  const debt = await prisma.debt.create({
    data: {
      type: input.type,
      contactName: input.contactName,
      amount: input.amount,
      remainingAmount: input.amount,
      status: "UNPAID",
      userId: user.id
    }
  });

  // 2. Buat Transaksi yang terhubung ke Hutang ini
  // Hutang = Uang masuk ke dompet (income)
  // Piutang = Uang keluar dari dompet (expense)
  const direction = input.type === "HUTANG" ? "income" : "expense";
  const paymentMethod = await getWalletPaymentLabel(input.walletId);

  const transaction = await prisma.transaction.create({
    data: {
      title: input.type === "HUTANG" ? `Hutang dari ${input.contactName}` : `Piutang ke ${input.contactName}`,
      amount: input.amount,
      direction,
      date: new Date(input.date),
      paymentMethod,
      walletId: input.walletId,
      categoryId: input.type === "HUTANG" ? "debt_in" : "debt_out",
      userId: user.id,
      debtId: debt.id
    }
  });

  return { debt, transaction };
}

// === CUSTOM CATEGORY ACTIONS ===
export async function addCategoryAction(input: {
  name: string;
  fullName: string;
  icon: string;
  bg: string;
  text: string;
  type: string;
}) {
  const user = await getSessionUser();
  
  const category = await prisma.category.create({
    data: {
      name: input.name,
      fullName: input.fullName,
      icon: input.icon,
      bg: input.bg,
      text: input.text,
      type: input.type,
      userId: user.id
    }
  });

  return category;
}

export async function payDebtAction(input: {
  debtId: string;
  amount: number;
  walletId: string;
  date: string;
}) {
  const user = await getSessionUser();

  const debt = await prisma.debt.findUnique({
    where: { id: input.debtId }
  });

  if (!debt || debt.userId !== user.id) {
    throw new Error("Debt not found or unauthorized");
  }

  // Jika HUTANG (kita minjam), saat bayar adalah PENGELUARAN (expense) -> Kategori: bayar_hutang
  // Jika PIUTANG (kita minjamin), saat dibayar adalah PEMASUKAN (income) -> Kategori: terima_piutang
  const direction = debt.type === "HUTANG" ? "expense" : "income";
  const categoryId = debt.type === "HUTANG" ? "bayar_hutang" : "terima_piutang";
  const title = debt.type === "HUTANG" ? `Cicilan Hutang ke ${debt.contactName}` : `Terima Cicilan dari ${debt.contactName}`;
  const paymentMethod = await getWalletPaymentLabel(input.walletId);

  // 1. Buat transaksi pembayaran
  const transaction = await prisma.transaction.create({
    data: {
      title,
      amount: input.amount,
      direction,
      date: new Date(input.date),
      paymentMethod,
      walletId: input.walletId,
      categoryId,
      debtId: debt.id,
      userId: user.id
    }
  });

  // 2. Update status Debt
  const newRemaining = Math.max(0, debt.remainingAmount - input.amount);
  const newStatus = newRemaining === 0 ? "PAID" : "PARTIAL";

  const updatedDebt = await prisma.debt.update({
    where: { id: debt.id },
    data: {
      remainingAmount: newRemaining,
      status: newStatus
    }
  });

  return { transaction, updatedDebt };
}
