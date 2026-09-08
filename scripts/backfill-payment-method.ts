import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Perbaikan data: addTransactionAction/updateTransactionAction/addDebtAction/payDebtAction
 * dulu salah menyimpan paymentMethod = walletId (cuid mentah) alih-alih nama dompet.
 * Skrip ini mencari transaksi yang paymentMethod-nya persis sama dengan walletId
 * miliknya sendiri (penanda pasti transaksi itu kena bug ini) dan mengisi ulang
 * dengan nama dompet yang sebenarnya.
 *
 * Jalankan dulu tanpa --apply untuk lihat pratinjau, baru tambahkan --apply untuk eksekusi nyata.
 */
async function main() {
  const apply = process.argv.includes("--apply");

  const transactions = await prisma.transaction.findMany({
    include: { wallet: { select: { id: true, name: true } } },
  });

  const broken = transactions.filter((t) => t.paymentMethod === t.walletId);

  console.log(`Total transaksi: ${transactions.length}`);
  console.log(`Transaksi dengan paymentMethod rusak (= walletId mentah): ${broken.length}`);

  for (const t of broken) {
    console.log(`  - [${t.id}] "${t.title}" : "${t.paymentMethod}" -> "${t.wallet.name}"`);
  }

  if (!apply) {
    console.log("\nDry-run selesai. Jalankan dengan --apply untuk menerapkan perubahan.");
    return;
  }

  let fixed = 0;
  for (const t of broken) {
    await prisma.transaction.update({
      where: { id: t.id },
      data: { paymentMethod: t.wallet.name },
    });
    fixed++;
  }
  console.log(`\nSelesai. ${fixed} transaksi diperbaiki.`);
}

main()
  .catch((err) => {
    console.error("Gagal menjalankan backfill:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
