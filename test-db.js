const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users.`);
  if (users.length > 0) {
    const user = users[0];
    console.log(`User: ${user.email} (${user.id})`);
    const transactions = await prisma.transaction.findMany({ where: { userId: user.id }});
    console.log(`Found ${transactions.length} transactions for user.`);
    const wallets = await prisma.wallet.findMany({ where: { ownerId: user.id }});
    console.log(`Found ${wallets.length} wallets for user.`);
    const categories = await prisma.category.findMany({ where: { userId: user.id }});
    console.log(`Found ${categories.length} custom categories for user.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
