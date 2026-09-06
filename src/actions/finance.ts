"use server";

import { PrismaClient } from "@prisma/client";
import { createClient } from "@/utils/supabase/server";
import type { NewTransactionInput, UpdateTransactionInput, NewWalletInput, UpdateWalletInput } from "@/lib/finance-context";

const prisma = new PrismaClient();

export async function getSessionUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user?.email) throw new Error("Unauthorized");
  
  let dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  
  // Lazy Sync: Jika belum ada di Prisma (misal login langsung tanpa lewat callback)
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split("@")[0],
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

    return { wallets, transactions };
  } catch (error) {
    return { wallets: [], transactions: [] };
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

// === DEV MODE: UPGRADE TIER ===
export async function setProTierAction() {
  const user = await getSessionUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionTier: "PRO" }
  });
  return true;
}


// === FETCH USER PROFILE DARI PRISMA ===
export async function getUserProfileAction() {
  const user = await getSessionUser();
  return {
    subscriptionTier: user.subscriptionTier,
    isReminderOn: user.isReminderOn
  };
}
