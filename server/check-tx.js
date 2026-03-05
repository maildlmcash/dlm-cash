const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransactions() {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        type: { in: ['PLAN_PURCHASE', 'BREAKDOWN', 'DIRECT_REFERRAL', 'REFUND'] }
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        txId: true,
        amount: true,
        currency: true,
        description: true,
        createdAt: true
      }
    });
    
    console.log('Recent transactions:');
    console.log(JSON.stringify(transactions, null, 2));
    
    const withoutTxId = transactions.filter(t => !t.txId);
    console.log(`\nTransactions without txId: ${withoutTxId.length} out of ${transactions.length}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkTransactions();
