"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { NewTransactionInput, UpdateTransactionInput, NewWalletInput, UpdateWalletInput } from "@/lib/finance-context";

const prisma = new PrismaClient();

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");
  return user;
}

export async function getFinanceData() {
  try {
    const user = await getSessionUser();
    const wallets = await prisma.wallet.findMany({
      where: { ownerId: user.id },
      include: { members: true },
      orderBy: { createdAt: "asc" }
    });
    
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
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
      userId: user.id
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
