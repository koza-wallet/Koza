"use server";

import { PrismaClient } from "@prisma/client";
import { createClient } from "@/utils/supabase/server";
import type { NewTransactionInput, UpdateTransactionInput, NewWalletInput, UpdateWalletInput } from "@/lib/finance-context";

const prisma = new PrismaClient();

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
    await prisma.wallet.create({
      data: {
        name: "Dompet Utama",
        icon: "account_balance_wallet",
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
    
    // Auto-fix: Jika pengguna lama tidak memiliki dompet, buatkan satu otomatis
    if (wallets.length === 0) {
      const defaultWallet = await prisma.wallet.create({
        data: {
          name: "Dompet Utama",
          icon: "account_balance_wallet",
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

export async function addWalletAction(input: NewWalletInput) {
  const user = await getSessionUser();
  const newWallet = await prisma.wallet.create({
    data: {
      name: input.name,
      ownerId: user.id,
      // For simplicity we just use icon for provider/type
      icon: input.provider || input.type
    }
  });
  return newWallet;
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
  const transaction = await prisma.transaction.create({
    data: {
      title: input.title,
      amount: input.amount,
      direction: input.direction,
      date: new Date(input.timestamp),
      paymentMethod: input.walletId,
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
  const user = await getSessionUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionTier: tier }
  });
  return true;
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

  // Auto-Provisioning: akun developer otomatis mendapat tier DEVELOPER
  // jika tier masih FREE (belum pernah diubah manual lewat Developer Menu)
  const devEmails = ["novriekadito@gmail.com", "novriekadito9@gmail.com"];
  if (devEmails.includes(user.email) && tier === "FREE") {
    tier = "DEVELOPER";
    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionTier: "DEVELOPER" }
    });
  }

  return {
    subscriptionTier: tier,
    isReminderOn: user.isReminderOn,
    email: user.email,
    name: user.name || user.email.split("@")[0]
  };
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
  
  const transaction = await prisma.transaction.create({
    data: {
      title: input.type === "HUTANG" ? `Hutang dari ${input.contactName}` : `Piutang ke ${input.contactName}`,
      amount: input.amount,
      direction,
      date: new Date(input.date),
      paymentMethod: input.walletId,
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

  // 1. Buat transaksi pembayaran
  const transaction = await prisma.transaction.create({
    data: {
      title,
      amount: input.amount,
      direction,
      date: new Date(input.date),
      paymentMethod: input.walletId,
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
