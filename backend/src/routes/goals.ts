import express from 'express';
import { prisma } from '../lib/prisma';
import { getCustodialClient, getAlgoBalance, algodClient, APP_ID, ensureMinimumAlgo } from '../lib/blockchain';
import { calcGoalMbr } from '../lib/contracts/PennyStalkerClient';
import algosdk from 'algosdk';

const router = express.Router();

// GET /api/goals/:userId - Fetch all visually enriched goals for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const goals = await prisma.goalMetadata.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
        deadline: new Date(deadline), // Expecting timestamp/ISO
        status: 'ACTIVE'
      }
    });

    // Convert bigints to strings for JSON serialization
    res.status(201).json({
      ...newGoal,
      targetAmount: newGoal.targetAmount.toString(),
      currentBalance: newGoal.currentBalance.toString()
    });
  } catch (error) {
    console.error('Error creating goal metadata:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/goals/sync - Sync balance / status after an on-chain action
router.put('/sync', async (req, res) => {
  try {
    const { userId, onChainGoalId, newBalance, newStatus } = req.body;

    if (!userId || onChainGoalId === undefined || newBalance === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const updatedGoal = await prisma.goalMetadata.update({
      where: {
        userId_onChainGoalId: {
          userId,
          onChainGoalId,
        }
      },
      data: {
        currentBalance: BigInt(newBalance),
        status: newStatus || undefined
      }
    });

    res.status(200).json({
      ...updatedGoal,
      targetAmount: updatedGoal.targetAmount.toString(),
      currentBalance: updatedGoal.currentBalance.toString()
    });
  } catch (error) {
    console.error('Error syncing goal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/goals/custodial - Perform on-chain goal creation for a custodial user
router.post('/custodial', async (req, res) => {
  try {
    const { userId, title, description, category, targetAmount, deadline } = req.body;

    if (!userId || !title || !targetAmount || !deadline) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.walletType !== 'CUSTODIAL' || !user.encryptedMnemonic) {
      return res.status(400).json({ error: 'Valid custodial vault not found' });
    }

    // 1. Calculate required MBR for this goal name
    const mbrMicroAlgo = calcGoalMbr(title);
    
    // 2. Check if account has enough ALGO for MBR + Fees (including potential opt-in)
    const balance = await getAlgoBalance(user.walletAddress!);
    const feeBuffer = 10_000n; // Increased to cover inner txns or opt-ins
    if (balance < mbrMicroAlgo + feeBuffer) {
      return res.status(400).json({ 
        error: `Insufficient ALGO balance in vault. Required: ${(Number(mbrMicroAlgo) / 1e6).toFixed(4)} ALGO.` 
      });
    }

    // 3. Perform on-chain creation (and ensure opt-in + funds)
    const client = getCustodialClient(user.encryptedMnemonic);
    await ensureMinimumAlgo(user.walletAddress!);
    await client.ensureAppOptIn();

    const deadlineUnix = BigInt(Math.floor(new Date(deadline).getTime() / 1000));
    const targetMicroUsdc = BigInt(targetAmount) * 1_000_000n; // Assuming input is USDC

    console.log(`🏗️ Creating on-chain goal '${title}' for ${user.walletAddress}...`);
    const { goalId, txId } = await client.createGoal({
      name: title,
      targetAmountMicroUsdc: targetMicroUsdc,
      deadlineUnixSec: deadlineUnix,
      mbrMicroAlgo: mbrMicroAlgo
    });

    // 4. Save metadata to database
    const newGoal = await prisma.goalMetadata.create({
      data: {
        userId,
        onChainGoalId: Number(goalId),
        title,
        description,
        category,
        targetAmount: targetMicroUsdc,
        currentBalance: 0n,
        deadline: new Date(deadline),
        status: 'ACTIVE'
      }
    });

    // 5. Log Goal Creation Activity
    await prisma.activityLog.create({
      data: {
        transactionId: txId,
        userId,
        onChainGoalId: Number(goalId),
        type: 'GOAL_CREATED',
        amount: null
      }
    });

    res.status(201).json({
      ...newGoal,
      targetAmount: newGoal.targetAmount.toString(),
      currentBalance: newGoal.currentBalance.toString()
    });
  } catch (error: any) {
    console.error('Custodial goal creation error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/goals/sync/:userId - Sync all user goals with on-chain box state
router.get('/sync/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.walletAddress) {
      return res.status(400).json({ error: 'User wallet not found' });
    }

    const goals = await prisma.goalMetadata.findMany({ where: { userId } });
    const userPublicKey = algosdk.decodeAddress(user.walletAddress).publicKey;

    console.log(`🔄 Syncing ${goals.length} goals for ${user.walletAddress}...`);

    for (const goal of goals) {
      try {
        // Construct Box Key: 'g' + public_key(32) + uint64_id(8)
        const boxKey = new Uint8Array([
          ...Buffer.from('g'),
          ...userPublicKey,
          ...algosdk.encodeUint64(goal.onChainGoalId)
        ]);

        const boxResponse = await algodClient.getApplicationBoxByName(Number(APP_ID), boxKey).do();
        const boxValue = boxResponse.value;

        // Decode Box Value (GoalStruct)
        // The uint64 fields are at the end of the box.
        // targetAmount: last 32 bytes to last 24 bytes
        // currentBalance: last 24 bytes to last 16 bytes
        
        const dataView = new DataView(boxValue.buffer, boxValue.byteOffset, boxValue.byteLength);
        
        // ARC-4 GoalStruct Decoding (Absolute Offsets):
        // [0-2]: Offset to name
        // [2-10]: targetAmount (uint64)
        // [10-18]: currentBalance (uint64)
        // [18-26]: deadline (uint64)
        // [26-34]: status (uint64)
        const onChainTarget = dataView.getBigUint64(2);
        const onChainBalance = dataView.getBigUint64(10);
        const onChainStatus = dataView.getBigUint64(26);

        // Update database
        await prisma.goalMetadata.update({
          where: { id: goal.id },
          data: {
            targetAmount: onChainTarget,
            currentBalance: onChainBalance,
            status: onChainStatus === 0n ? 'ACTIVE' : (onChainStatus === 1n ? 'COMPLETED' : 'WITHDRAWN')
          }
        });
      } catch (e: any) {
        if (e.status === 404) {
             console.warn(`⚠️ Box for goal ${goal.onChainGoalId} not found. It might have been withdrawn.`);
             // If not found, maybe mark as WITHDRAWN or ignore
             await prisma.goalMetadata.update({
                where: { id: goal.id },
                data: { status: 'WITHDRAWN' }
             });
        } else {
            console.error(`❌ Error syncing goal ${goal.onChainGoalId}:`, e.message);
        }
      }
    }

    const updatedGoals = await prisma.goalMetadata.findMany({ where: { userId } });
    res.json(updatedGoals.map(g => ({
        ...g,
        targetAmount: g.targetAmount.toString(),
        currentBalance: g.currentBalance.toString()
    })));
  } catch (error: any) {
    console.error('Global sync error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/goals/deposit - Perform on-chain USDC deposit for a custodial user
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

    // 1. Initial on-chain setup
    const client = getCustodialClient(user.encryptedMnemonic);
    const usdcAssetId = await client.getUsdcAssetId();
    const amountMicroUsdc = BigInt(amount) * 1_000_000n;

    console.log(`💰 Preparing custodial deposit for ${user.walletAddress}...`);
    
    // Ensure the custodial account has funds and is opted into the app and USDC
    await ensureMinimumAlgo(user.walletAddress!);
    await client.ensureAppOptIn();
    await client.ensureAssetOptIn(usdcAssetId);
    
    // 2. Perform on-chain deposit
    const txId = await client.deposit({
      goalId: BigInt(onChainGoalId),
      amountMicroUsdc,
      usdcAssetId
    });

    // 3. Create Activity Log
    await prisma.activityLog.create({
      data: {
        transactionId: txId,
        userId,
        onChainGoalId: Number(onChainGoalId),
        type: 'deposit',
        amount: amountMicroUsdc
      }
    });

    // 4. Update Goal Balance in DB (Optional, but good for immediate UI feedback before full sync)
    const goal = await prisma.goalMetadata.findUnique({
      where: { userId_onChainGoalId: { userId, onChainGoalId: Number(onChainGoalId) } }
    });

    if (goal) {
      await prisma.goalMetadata.update({
        where: { id: goal.id },
        data: { currentBalance: goal.currentBalance + amountMicroUsdc }
      });
    }

    res.status(200).json({ txId, message: 'Deposit successful' });
  } catch (error: any) {
    console.error('Custodial deposit error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
