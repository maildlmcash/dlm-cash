import { prisma } from './src/lib/prisma';

(async () => {
  try {
    const networks = await prisma.networkConfig.findMany({
      select: {
        network: true,
        explorerApiKey: true,
        isActive: true,
        depositEnabled: true,
      },
    });

    console.log('\n📊 NetworkConfig Table:');
    console.table(networks);

    if (networks.length === 0) {
      console.log('\n⚠️ No network configurations found in database!');
      console.log('Networks are using DEFAULT_NETWORKS hardcoded values.');
    } else {
      const missingKeys = networks.filter(n => !n.explorerApiKey);
      if (missingKeys.length > 0) {
        console.log('\n❌ Networks missing API keys:');
        missingKeys.forEach(n => console.log(`   - ${n.network}`));
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
