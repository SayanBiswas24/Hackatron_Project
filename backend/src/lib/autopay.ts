import { prisma } from './prisma';
import { getCustodialClient, getUsdcBalance, USDC_ASSET_ID } from './blockchain';

/**
 * Sweeps all active goals with autopay enabled and processes due payments.
 */
export async function processScheduledAutopays() {
  console.log('🗓️ Checking for due autopays...');
  const now = new Date();

  // Find all goals where autopay is enabled and the scheduled date is now or in the past
  const dueGoals = await prisma.goalMetadata.findMany({
    where: {
      autopayEnabled: true,
      nextAutopayAt: { lte: now },
      status: 'ACTIVE'
    },
    include: {
      user: true
    }
  });

  if (dueGoals.length === 0) {
    console.log('✅ No due autopays found.');
    return;
  }

  console.log(`🚀 Found ${dueGoals.length} due autopays.`);

  for (const goal of dueGoals) {
    try {
      const { user } = goal;
      if (!user || user.walletType !== 'CUSTODIAL' || !user.encryptedMnemonic || !user.walletAddress) {
        console.warn(`⚠️ Skipping goal ${goal.title}: User not set up for custodial autopay.`);
        continue;
      }

      const autopayAmount = goal.autopayAmount || 0n;
      
      // 1. Check USDC Balance using the helper from blockchain.ts
      const balance = await getUsdcBalance(user.walletAddress);

      if (balance < autopayAmount) {
        console.error(`❌ Insufficient funds for autopay on goal '${goal.title}' (${user.walletAddress}). Required: ${autopayAmount}, Available: ${balance}`);
        
        await prisma.goalMetadata.update({
          where: { id: goal.id },
          data: { lastAutopayStatus: 'FAILED' }
        });

        await prisma.activityLog.create({
          data: {
            transactionId: `FAILED_AUTOPAY_${Date.now()}`,
            userId: user.id,
            onChainGoalId: goal.onChainGoalId,
            type: 'AUTOPAY_FAILED',
            amount: autopayAmount
          }
        });
        continue;
      }

      // 2. Process Deposit via Custodial Client
      const client = getCustodialClient(user.encryptedMnemonic);
      console.log(`💰 Executing scheduled autopay for goal '${goal.title}' | Amount: ${autopayAmount}`);
      
      const txId = await client.deposit({
        goalId: BigInt(goal.onChainGoalId),
        amountMicroUsdc: autopayAmount,
        usdcAssetId: USDC_ASSET_ID
      });

      // 3. Update State - Move next payment exactly 1 month forward
      const nextMonth = new Date(goal.nextAutopayAt!);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await prisma.goalMetadata.update({
        where: { id: goal.id },
        data: {
          currentBalance: goal.currentBalance + autopayAmount,
          lastAutopayAt: now,
          nextAutopayAt: nextMonth,
          lastAutopayStatus: 'SUCCESS'
        }
      });

      await prisma.activityLog.create({
        data: {
          transactionId: txId,
          userId: user.id,
          onChainGoalId: goal.onChainGoalId,
          type: 'AUTOPAY_SUCCESS',
          amount: autopayAmount
        }
      });

      console.log(`✅ Autopay success: ${txId}`);

    } catch (error: any) {
      console.error(`🔴 Error processing autopay for goal ${goal.id}:`, error.message);
    }
  }
}
