const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedNetworks() {
  console.log('🔄 Checking NetworkConfig table...\n');

  try {
    // Check existing networks
    const existingNetworks = await prisma.networkConfig.findMany();
    console.log(`Found ${existingNetworks.length} existing networks`);

    if (existingNetworks.length > 0) {
      console.log('\n📋 Existing Networks:');
      existingNetworks.forEach(network => {
        console.log(`  - ${network.name} (${network.network})`);
        console.log(`    Active: ${network.isActive}, Withdraw: ${network.withdrawEnabled}, Deposit: ${network.depositEnabled}`);
      });
    }

    // Networks to seed
    const networksToSeed = [
      {
        network: 'SEPOLIA',
        name: 'Sepolia Testnet',
        chainId: 11155111,
        rpcUrl: 'https://ethereum-sepolia.publicnode.com',
        explorerUrl: 'https://sepolia.etherscan.io',
        explorerApiUrl: 'https://api-sepolia.etherscan.io/api',
        tokenAddress: '0xf37b0D267B05b16eA490134487fc4FAc2e3eD2a6',
        poolAddress: '0x2196f8f2129b241a6D44830302Ab5B1eCA1d0f79',
        tokenDecimals: 18,
        isActive: true,
        withdrawEnabled: true,
        depositEnabled: true,
      },
      {
        network: 'ETHEREUM',
        name: 'Ethereum Mainnet',
        chainId: 1,
        rpcUrl: 'https://ethereum-rpc.publicnode.com',
        explorerUrl: 'https://etherscan.io',
        explorerApiUrl: 'https://api.etherscan.io/api',
        tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        poolAddress: '0x2196f8f2129b241a6D44830302Ab5B1eCA1d0f79',
        tokenDecimals: 6,
        isActive: false,
        withdrawEnabled: false,
        depositEnabled: false,
      },
      {
        network: 'BSC',
        name: 'BNB Smart Chain',
        chainId: 56,
        rpcUrl: 'https://bsc-rpc.publicnode.com',
        explorerUrl: 'https://bscscan.com',
        explorerApiUrl: 'https://api.bscscan.com/api',
        tokenAddress: '0x55d398326f99059fF775485246999027B3197955',
        poolAddress: '0x2196f8f2129b241a6D44830302Ab5B1eCA1d0f79',
        tokenDecimals: 18,
        isActive: false,
        withdrawEnabled: false,
        depositEnabled: false,
      },
    ];

    console.log('\n🌐 Seeding networks...');
    let created = 0;
    let skipped = 0;

    for (const networkData of networksToSeed) {
      const existing = await prisma.networkConfig.findUnique({
        where: { network: networkData.network },
      });

      if (!existing) {
        await prisma.networkConfig.create({
          data: networkData,
        });
        console.log(`✅ Created: ${networkData.name}`);
        created++;
      } else {
        console.log(`⏭️  Skipped: ${networkData.name} (already exists)`);
        skipped++;
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);

    // Show final state
    const finalNetworks = await prisma.networkConfig.findMany({
      orderBy: { network: 'asc' },
    });

    console.log('\n📋 Final Network Configuration:');
    finalNetworks.forEach(network => {
      console.log(`\n  ${network.name} (${network.network})`);
      console.log(`    Chain ID: ${network.chainId}`);
      console.log(`    Active: ${network.isActive ? '✓' : '✗'}`);
      console.log(`    Withdraw: ${network.withdrawEnabled ? '✓' : '✗'}`);
      console.log(`    Deposit: ${network.depositEnabled ? '✓' : '✗'}`);
      console.log(`    Pool: ${network.poolAddress}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNetworks();
