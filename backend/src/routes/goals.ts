import express from 'express';
import { prisma } from '../lib/prisma';
import { getCustodialClient, getAlgoBalance, algodClient, APP_ID, ensureMinimumAlgo, airdropUsdc } from '../lib/blockchain';
import { calcGoalMbr } from '../lib/contracts/PennyStalkerClient';
import algosdk from 'algosdk';

const router = express.Router();

/**
 * Helper to serialize BigInts to strings for JSON responses
 */
const serializeGoal = (goal: any) => ({
  ...goal,
  targetAmount: goal.targetAmount.toString(),
  currentBalance: goal.currentBalance.toString(),
  autopayAmount: goal.autopayAmount?.toString() || null,
  consecutiveMonths: goal.consecutiveMonths,
  lastIncentiveAt: goal.lastIncentiveAt ? goal.lastIncentiveAt.toISOString() : null,
});

// ─────────────────────────────────────────────────────────────
// SPECIFIC ROUTES FIRST — must come before wildcard /:userId
// ─────────────────────────────────────────────────────────────

// POST /api/goals - Sync a newly created on-chain goal with off-chain metadata
router.post('/', async (req, res) => {
  try {
    const { userId, onChainGoalId, title, description, category, coverImageUrl, colorHex, targetAmount, deadline } = req.body;

    if (!userId || onChainGoalId === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newGoal = await prisma.goalMetadata.create({
      data: {
        userId,
        onChainGoalId,
        title,
        description,
        category,
        coverImageUrl,
        colorHex,
        targetAmount: BigInt(targetAmount),
        currentBalance: BigInt(0),
        deadline: new Date(deadline),
        status: 'ACTIVE'
      }
    });

    res.status(201).json(serializeGoal(newGoal));
  } catch (error) {
    console.error('Error creating goal metadata:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/goals/sync - Sync balance/status after an on-chain action
router.put('/sync', async (req, res) => {
  try {
    const { userId, onChainGoalId, newBalance, newStatus } = req.body;

    if (!userId || onChainGoalId === undefined || newBalance === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const accruedRewards = await prisma.activityLog.aggregate({
      where: { 
        userId, 
        onChainGoalId: Number(onChainGoalId),
        type: { in: ['incentive', 'completion_reward'] } 
      },
      _sum: { amount: true }
    });

    const totalBalance = BigInt(newBalance) + (accruedRewards._sum.amount || 0n);

    const updatedGoal = await prisma.goalMetadata.update({
      where: { userId_onChainGoalId: { userId, onChainGoalId } },
      data: {
        currentBalance: totalBalance,
        status: newStatus || undefined
      }
    });

    res.status(200).json(serializeGoal(updatedGoal));
  } catch (error) {
    console.error('Error syncing goal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/goals/sync/:userId - Sync all user goals with on-chain box state
router.get('/sync/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.walletAddress) {
      // No wallet yet — return DB goals without on-chain sync
      const goals = await prisma.goalMetadata.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(goals.map(serializeGoal));
    }

    const goals = await prisma.goalMetadata.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (goals.length === 0) {
      return res.json([]);
    }

    const userPublicKey = algosdk.decodeAddress(user.walletAddress).publicKey;

    for (const goal of goals) {
      try {
        const boxKey = new Uint8Array([
          ...Buffer.from('g'),
          ...userPublicKey,
          ...algosdk.encodeUint64(goal.onChainGoalId)
        ]);

        const boxResponse = await algodClient.getApplicationBoxByName(Number(APP_ID), boxKey).do();
        const boxValue = boxResponse.value;
        const dataView = new DataView(boxValue.buffer, boxValue.byteOffset, boxValue.byteLength);

        const onChainTarget = dataView.getBigUint64(2);
        const onChainBalance = dataView.getBigUint64(10);
        const onChainStatus = dataView.getBigUint64(26);

        // Fetch accrued rewards (incentives/bonuses) from DB to get total real balance
        const accruedRewards = await prisma.activityLog.aggregate({
          where: { 
            userId, 
            onChainGoalId: goal.onChainGoalId,
            type: { in: ['incentive', 'completion_reward'] } 
          },
          _sum: { amount: true }
        });

        const totalBalance = onChainBalance + (accruedRewards._sum.amount || 0n);

        await prisma.goalMetadata.update({
          where: { id: goal.id },
          data: {
            targetAmount: onChainTarget,
            currentBalance: totalBalance,
            status: onChainStatus === 0n ? 'ACTIVE' : (onChainStatus === 1n ? 'COMPLETED' : 'WITHDRAWN')
          }
        });
      } catch (e: any) {
        if (e.status === 404) {
          await prisma.goalMetadata.update({
            where: { id: goal.id },
            data: { status: 'WITHDRAWN' }
          });
        }
      }
    }

    const updatedGoals = await prisma.goalMetadata.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(updatedGoals.map(serializeGoal));
  } catch (error: any) {
    console.error('Global sync error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/goals/custodial - Perform on-chain goal creation for a custodial user
router.post('/custodial', async (req, res) => {
  try {
    const { userId, title, description, category, targetAmount, deadline, autopayEnabled, autopayAmount } = req.body;

    if (!userId || !title || !targetAmount || !deadline) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.walletType !== 'CUSTODIAL' || !user.encryptedMnemonic) {
      return res.status(400).json({ error: 'Valid custodial vault not found' });
    }

    const mbrMicroAlgo = calcGoalMbr(title);
    await ensureMinimumAlgo(user.walletAddress!);

    const balance = await getAlgoBalance(user.walletAddress!);
    const feeBuffer = 10_000n;
    if (balance < mbrMicroAlgo + feeBuffer) {
      return res.status(400).json({
        error: `Insufficient ALGO balance in vault. Required: ${(Number(mbrMicroAlgo) / 1e6).toFixed(4)} ALGO.`
      });
    }

    const client = getCustodialClient(user.encryptedMnemonic);
    await client.ensureAppOptIn();

    const deadlineUnix = BigInt(Math.floor(new Date(deadline).getTime() / 1000));
    const targetMicroUsdc = BigInt(Math.round(Number(targetAmount) * 1_000_000));

    console.log(`🏗️ Creating on-chain goal '${title}' for ${user.walletAddress}...`);
    const { goalId, txId } = await client.createGoal({
      name: title,
      targetAmountMicroUsdc: targetMicroUsdc,
      deadlineUnixSec: deadlineUnix,
      mbrMicroAlgo: mbrMicroAlgo
    });

    const nextAutopayDate = new Date();
    nextAutopayDate.setMonth(nextAutopayDate.getMonth() + 1);

    const newGoal = await prisma.goalMetadata.create({
      data: {
        userId,
        onChainGoalId: Number(goalId),
        title,
        description,
        category: category || 'general',
        targetAmount: targetMicroUsdc,
        currentBalance: 0n,
        deadline: new Date(deadline),
        status: 'ACTIVE',
        autopayEnabled: !!autopayEnabled,
        autopayAmount: autopayAmount ? BigInt(Math.round(Number(autopayAmount) * 1_000_000)) : null,
        nextAutopayAt: autopayEnabled ? nextAutopayDate : null
      }
    });

    await prisma.activityLog.create({
      data: {
        transactionId: txId,
        userId,
        onChainGoalId: Number(goalId),
        type: 'GOAL_CREATED',
        amount: null
      }
    });

    res.status(201).json(serializeGoal(newGoal));
  } catch (error: any) {
    console.error('Custodial goal creation error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/goals/deposit/custodial - Perform on-chain USDC deposit for a custodial user
router.post('/deposit/custodial', async (req, res) => {
  try {
    const { userId, onChainGoalId, amount } = req.body;

    if (!userId || onChainGoalId === undefined || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.walletType !== 'CUSTODIAL' || !user.encryptedMnemonic) {
      return res.status(400).json({ error: 'Valid custodial vault not found' });
    }

    const client = getCustodialClient(user.encryptedMnemonic);
    const usdcAssetId = await client.getUsdcAssetId();
    const amountMicroUsdc = BigInt(Math.round(Number(amount) * 1_000_000)); // Safely convert float to microUSDC

    console.log(`💰 Preparing custodial deposit for ${user.walletAddress}...`);

    await ensureMinimumAlgo(user.walletAddress!);
    await client.ensureAppOptIn();
    await client.ensureAssetOptIn(usdcAssetId);

    const txId = await client.deposit({
      goalId: BigInt(onChainGoalId),
      amountMicroUsdc,
      usdcAssetId
    });

    await prisma.activityLog.create({
      data: {
        transactionId: txId,
        userId,
        onChainGoalId: Number(onChainGoalId),
        type: 'deposit',
        amount: amountMicroUsdc
      }
    });

    const goal = await prisma.goalMetadata.findUnique({
      where: { userId_onChainGoalId: { userId, onChainGoalId: Number(onChainGoalId) } }
    });

    let incentiveRecord: any = null;

    if (goal) {
      let nextAutopayAt = goal.nextAutopayAt;
      let consecutiveMonths = goal.consecutiveMonths;
      let lastIncentiveAt = goal.lastIncentiveAt;
      let incentiveAirdropped = false;
      let completionAirdropped = false;

      // 1. Consistency Incentive Logic (High Frequency - reward every deposit)
      const now = new Date();
      // Check if consistent (last reward was within the last 30 days)
      const gapDays = lastIncentiveAt ? (now.getTime() - lastIncentiveAt.getTime()) / (1000 * 60 * 60 * 24) : 0;
      
      if (lastIncentiveAt && gapDays > 30) {
        console.log(`🕒 ${gapDays.toFixed(1)} days since last deposit. Resetting streak to base.`);
        consecutiveMonths = 1;
      } else {
        consecutiveMonths += 1;
      }

      // Calculate incentive rate: 0.5%, 1.0%, 1.5% ... cap at 4.0%
      const rate = Math.min(0.04, 0.005 * consecutiveMonths);
      const incentiveAmountUsdc = Number(amount) * rate;

      if (incentiveAmountUsdc > 0.001) { // Airdrop even small rewards
        console.log(`🎁 Consistency Bonus: ${rate * 100}% of ${amount} = ${incentiveAmountUsdc} USDC`);
        await airdropUsdc(user.walletAddress!, incentiveAmountUsdc);
        
        await prisma.activityLog.create({
          data: {
            transactionId: `INCENTIVE_${Date.now()}`,
            userId,
            onChainGoalId: goal.onChainGoalId,
            type: 'incentive',
            amount: BigInt(Math.round(incentiveAmountUsdc * 1_000_000))
          }
        });
        lastIncentiveAt = now;
        incentiveAirdropped = true;
        incentiveRecord = { amount: incentiveAmountUsdc, streak: consecutiveMonths, type: 'CONSISTENCY' };
      }

      // 2. Autopay Schedule Advance (if manual deposit satisfies the month)
      if (goal.autopayEnabled && goal.autopayAmount && amountMicroUsdc >= goal.autopayAmount) {
        console.log(`⏭️ Manual deposit satisfies autopay for goal '${goal.title}'. Advancing schedule.`);
        const baseDate = goal.nextAutopayAt || new Date();
        const advancedDate = new Date(baseDate.getTime());
        advancedDate.setMonth(advancedDate.getMonth() + 1);
        nextAutopayAt = advancedDate;
      }

      // 3. Goal Completion Reward
      let totalAmountToIncrement = amountMicroUsdc;
      if (incentiveAirdropped) {
        totalAmountToIncrement += BigInt(Math.round(incentiveAmountUsdc * 1_000_000));
      }

      let newBalance = goal.currentBalance + totalAmountToIncrement;
      
      if (newBalance >= goal.targetAmount && goal.status === 'ACTIVE') {
        const bonusAmount = Number(goal.targetAmount) / 1_000_000 * 0.01; // 1% completion bonus
        console.log(`🏆 Goal Completed! Airdropping ${bonusAmount} USDC bonus...`);
        await airdropUsdc(user.walletAddress!, bonusAmount);
        
        const bonusMicroUsdc = BigInt(Math.round(bonusAmount * 1_000_000));
        newBalance += bonusMicroUsdc; // Include bonus in final balance

        await prisma.activityLog.create({
          data: {
            transactionId: `COMPLETION_${Date.now()}`,
            userId,
            onChainGoalId: goal.onChainGoalId,
            type: 'completion_reward',
            amount: bonusMicroUsdc
          }
        });
        completionAirdropped = true;
        incentiveRecord = { 
          ...incentiveRecord, 
          isCompletion: true, 
          completionBonus: bonusAmount 
        };
      }

      await prisma.goalMetadata.update({
        where: { id: goal.id },
        data: {
          currentBalance: newBalance,
          nextAutopayAt,
          consecutiveMonths,
          lastIncentiveAt,
          status: newBalance >= goal.targetAmount ? 'COMPLETED' : 'ACTIVE'
        }
      });
    }

    res.status(200).json({ 
      txId, 
      message: 'Deposit successful',
      reward: incentiveRecord
    });
  } catch (error: any) {
    console.error('Custodial deposit error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// PUT /api/goals/autopay - Update autopay settings for a goal
router.put('/autopay', async (req, res) => {
  try {
    const { userId, onChainGoalId, autopayEnabled, autopayAmount } = req.body;

    if (!userId || onChainGoalId === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const goal = await prisma.goalMetadata.findUnique({
      where: { userId_onChainGoalId: { userId, onChainGoalId: Number(onChainGoalId) } }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const nextAutopayDate = new Date();
    nextAutopayDate.setMonth(nextAutopayDate.getMonth() + 1);

    const updatedGoal = await prisma.goalMetadata.update({
      where: { id: goal.id },
      data: {
        autopayEnabled: autopayEnabled !== undefined ? !!autopayEnabled : goal.autopayEnabled,
        autopayAmount: autopayAmount !== undefined ? BigInt(autopayAmount) * 1_000_000n : goal.autopayAmount,
        nextAutopayAt: (autopayEnabled && !goal.autopayEnabled) ? nextAutopayDate : goal.nextAutopayAt
      }
    });

    res.json(serializeGoal(updatedGoal));
  } catch (error: any) {
    console.error('Update autopay error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// WILDCARD ROUTE LAST — catches /:userId
// ─────────────────────────────────────────────────────────────

// GET /api/goals/:userId - Fetch all goals for a user (DB-only, fast)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const goals = await prisma.goalMetadata.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(goals.map(serializeGoal));
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
