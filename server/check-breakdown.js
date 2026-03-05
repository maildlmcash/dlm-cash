const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBreakdown() {
  const breakdownTxs = await prisma.transaction.findMany({
    where: { type: 'BREAKDOWN' },
    take: 5
  });
  
  console.log('BREAKDOWN transactions found:', breakdownTxs.length);
  console.log(JSON.stringify(breakdownTxs, null, 2));
  
  await prisma.$disconnect();
}

checkBreakdown().catch(console.error);
