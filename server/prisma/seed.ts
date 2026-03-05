import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  
  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@dlmcrypto.com' }
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists - updating to unblock and reset...');
    
    // Update existing admin: unblock and reset
    await prisma.user.update({
      where: { email: 'admin@dlmcrypto.com' },
      data: {
        passwordHash: adminPassword,
        status: 'ACTIVE',
        role: 'ADMIN',
        isVerified: true,
        kycStatus: 'APPROVED',
      }
    });
    
    console.log('✅ Admin user updated successfully!');
    console.log('📧 Email: admin@dlmcrypto.com');
    console.log('🔑 Password: Admin@123');
    console.log('✅ Status: ACTIVE (unblocked)');
    console.log('⚠️  Please change this password after login!');
    return;
  }

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@dlmcrypto.com',
      name: 'Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      kycStatus: 'APPROVED',
    }
  });

  console.log('✅ Admin user created successfully!');
  console.log('📧 Email:', admin.email);
  console.log('🔑 Password: Admin@123');
  console.log('⚠️  Please change this password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
