import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pennystalker?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const walletAddress = 'test-wallet-123';

  console.log(`Seeding database for wallet: ${walletAddress}...`);

  // Ensure user exists
  const user = await prisma.user.upsert({
    where: { email: 'satoshi@pennystalker.xyz' },
    update: {
      walletAddress,
    },
    create: {
      email: 'satoshi@pennystalker.xyz',
      password: await bcrypt.hash('password123', 10),
      walletAddress,
      displayName: 'Satoshi Testing',
      themePreference: 'neon-lime',
    },
  });

  // Clear existing logs strictly for repeatable testing logic locally
  await prisma.activityLog.deleteMany({ where: { userId: user.id } });

  // Seed Goals
  await prisma.goalMetadata.upsert({
    where: { userId_onChainGoalId: { userId: user.id, onChainGoalId: 0 } },
    update: { currentBalance: 750000000n },
    create: {
      userId: user.id,
      onChainGoalId: 0,
      title: 'New Hardware Upgrade',
      targetAmount: 2500000000n, // 2500 USDC
      currentBalance: 750000000n, // 750 USDC
      deadline: new Date('2026-12-31'),
      status: 'ACTIVE',
      category: 'hardware',
      colorHex: '#00F0FF',
    },
  });

  await prisma.goalMetadata.upsert({
    where: { userId_onChainGoalId: { userId: user.id, onChainGoalId: 1 } },
    update: { currentBalance: 4000000000n },
    create: {
      userId: user.id,
      onChainGoalId: 1,
      title: 'Solana Dev Trip',
      targetAmount: 5000000000n, // 5000 USDC
      currentBalance: 4000000000n, // 4000 USDC
      deadline: new Date('2026-08-15'),
      status: 'ACTIVE',
      category: 'travel',
      colorHex: '#BF5AF2',
    },
  });

  // Seed Activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      transactionId: 'TXN' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      onChainGoalId: 0,
      type: 'DEPOSIT',
      amount: 250000000n, // +250 USDC
    }
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      transactionId: 'TXN' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      onChainGoalId: 1,
      type: 'DEPOSIT',
      amount: 1000000000n, // +1000 USDC
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
