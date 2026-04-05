import express from 'express';
import algosdk from 'algosdk';
import { prisma } from '../lib/prisma';
import { encrypt } from '../lib/crypto';
import {
  getCustodialClient,
  getPlatformClient,
  USDC_ASSET_ID,
  airdropAlgo,
  getAlgoBalance,
  getUsdcBalance,
  airdropUsdc,
  withdrawUsdc
} from '../lib/blockchain';

const router = express.Router();

// POST /api/wallet/setup - Handle one-time wallet setup during onboarding
router.post('/setup', async (req, res) => {
  try {
    const { userId, type, mnemonic, walletAddress, governanceEnabled = false } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.onboardingComplete) {
      return res.status(400).json({ error: 'Onboarding already complete' });
    }

    let finalAddress = walletAddress;
    let encryptedMnemonic = null;
    let revealedMnemonic: string | undefined; // Only set for new custodial creation

    if (type === 'CUSTODIAL') {
      if (mnemonic) {
        // Import existing
        try {
          const account = algosdk.mnemonicToSecretKey(mnemonic);
          finalAddress = account.addr.toString();
          encryptedMnemonic = encrypt(mnemonic);
        } catch (e) {
          return res.status(400).json({ error: 'Invalid mnemonic phrase' });
        }
      } else {
        // Create new — reveal mnemonic once for user backup
        const newAccount = algosdk.generateAccount();
        revealedMnemonic = algosdk.secretKeyToMnemonic(newAccount.sk);
        finalAddress = newAccount.addr.toString();
        encryptedMnemonic = encrypt(revealedMnemonic);
      }
    } else if (type === 'PERA') {
      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address is required for Pera' });
      }
      // Just use the provided address
    } else {
      return res.status(400).json({ error: 'Invalid wallet type' });
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        walletAddress: finalAddress,
        walletType: type,
        encryptedMnemonic,
        onboardingComplete: true,
        governanceEnabled: Boolean(governanceEnabled)
      }
    });

    res.json({
      message: 'Wallet setup successfully',
      walletAddress: finalAddress,
      walletType: type,
      // Only present when a new custodial wallet is created — must be backed up by user
      ...(revealedMnemonic ? { mnemonic: revealedMnemonic } : {})
    });
  } catch (error) {
    console.error('Wallet setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/wallet/optin - Request custodial signer to perform on-chain opt-ins
router.post('/optin', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.walletType !== 'CUSTODIAL' || !user.encryptedMnemonic) {
      return res.status(400).json({ error: 'Valid custodial vault not found' });
    }

    // 1. Check if airdrop is needed
    if (!user.faucetAirdropped) {
      console.log(`🎁 Initiating one-time faucet airdrop for ${user.walletAddress}...`);
      await airdropAlgo(user.walletAddress!);

      // Update database right after successful airdrop to prevent double-spend
      await prisma.user.update({
        where: { id: userId },
        data: { faucetAirdropped: true }
      });
    }

    const client = getCustodialClient(user.encryptedMnemonic);
    const platformClient = getPlatformClient();

    console.log(`🔗 Opting user ${user.walletAddress} into App and USDC...`);

    // 1. User Opt-in to the PennyStalker App
    await client.optInToApp();

    // 2. User Opt-in to USDC
    console.log(`🪙 Opting user into USDC (Asset: ${USDC_ASSET_ID})...`);
    await client.ensureAssetOptIn(USDC_ASSET_ID);

    // 3. Platform initializes the USDC vault for the contract if not already done
    console.log(`🛡️ Platform initializing USDC opt-in for App...`);
    await platformClient.optIntoUsdc(USDC_ASSET_ID);

    res.json({ message: 'Success' });
  } catch (error: any) {
    console.error('Opt-in error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/wallet/balance/:userId - Fetch custodial balances
router.get('/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("📥 Fetching balance for user:", userId);

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.walletAddress) {
      console.log("❌ Wallet not found for user");
      return res.status(400).json({ error: 'Wallet not initialized' });
    }

    console.log("✅ Wallet found:", user.walletAddress);

    try {
      const algoBalance = await getAlgoBalance(user.walletAddress);
      const usdcBalance = await getUsdcBalance(user.walletAddress);

      // We only fallback to DB-derived balance if blockchain balance is 0 AND we have recorded activities.
      // This prevents "doubling" where on-chain and off-chain sync are both active.
      let dbBalance = 0n;
      let finalUsdc = usdcBalance;

      if (usdcBalance === 0n) {
        const activities = await prisma.activityLog.findMany({
          where: { userId }
        });

        activities.forEach(a => {
          const type = a.type.toUpperCase();
          const amt = a.amount || 0n;
          
          if (type === 'PURCHASE' || (type === 'DEPOSIT' && a.onChainGoalId === null)) {
            dbBalance += amt;
          } 
          else if (type === 'WITHDRAWAL' && a.onChainGoalId === null) {
            dbBalance -= amt;
          }
          else if ((type === 'DEPOSIT' && a.onChainGoalId !== null) || type === 'AUTOPAY_SUCCESS') {
            dbBalance -= amt;
          }
          else if (type === 'GOAL_WITHDRAWAL' || (type === 'WITHDRAWAL' && a.onChainGoalId !== null)) {
            dbBalance += amt;
          }
        });
        finalUsdc = dbBalance;
      }

      return res.json({
        address: user.walletAddress,
        algo: algoBalance.toString(),
        usdc: finalUsdc.toString(),
        isSimulated: usdcBalance === 0n && dbBalance > 0n
      });
    } catch (blockchainError: any) {
      console.error("🔥 Blockchain Error:", blockchainError);
      
      // Fallback to purely DB-based balance if blockchain is unreachable
      const activities = await prisma.activityLog.findMany({ where: { userId } });
      let dbBalance = 0n;
      activities.forEach(a => {
        const type = a.type.toUpperCase();
        const amt = a.amount || 0n;
        
        if (type === 'PURCHASE' || (type === 'DEPOSIT' && a.onChainGoalId === null)) {
          dbBalance += amt;
        } else if (type === 'WITHDRAWAL' && a.onChainGoalId === null) {
          dbBalance -= amt;
        } else if ((type === 'DEPOSIT' && a.onChainGoalId !== null) || type === 'AUTOPAY_SUCCESS') {
          dbBalance -= amt;
        } else if (type === 'GOAL_WITHDRAWAL' || (type === 'WITHDRAWAL' && a.onChainGoalId !== null)) {
          dbBalance += amt;
        }
      });

      return res.json({
        address: user.walletAddress,
        algo: "0",
        usdc: dbBalance.toString(),
        warning: "Blockchain unreachable, showing local tracked balance"
      });
    }

  } catch (error: any) {
    console.error("🔥 Server Error:", error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/wallet/faucet - Request Testnet USDC airdrop (Legacy/Testnet)
router.post('/faucet', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.walletType !== 'CUSTODIAL' || !user.walletAddress) {
      return res.status(400).json({ error: 'Valid custodial wallet not found' });
    }

    // Enforce 24-hour cooldown
    if (user.lastFaucetAt) {
      const now = new Date();
      const last = new Date(user.lastFaucetAt);
      const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);

      if (diffHours < 24) {
        return res.status(429).json({
          error: `Faucet cooldown active. Please wait ${Math.ceil(24 - diffHours)} more hours.`
        });
      }
    }

    console.log(`🚰 Faucet request for ${user.walletAddress}...`);
    const txId = await airdropUsdc(user.walletAddress, 1000);

    // Update cooldown
    await prisma.user.update({
      where: { id: userId },
      data: { lastFaucetAt: new Date() }
    });

    res.json({ txId, message: '1,000 USDC airdropped successfully' });
  } catch (error: any) {
    console.error('Faucet error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/wallet/purchase - Simulated USDC Purchase (High-Fidelity Demo)
router.post('/purchase', async (req, res) => {
  try {
    const { userId, amount, paymentMethod } = req.body;

    console.log("📥 Purchase request:", { userId, amount, paymentMethod });

    if (!userId || !amount) {
      return res.status(400).json({ error: 'User ID and amount are required' });
    }

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.walletAddress) {
      console.log("❌ Wallet not found");
      return res.status(404).json({ error: 'User wallet not found' });
    }

    console.log("✅ Wallet:", user.walletAddress);

    try {
      // STEP 1: Ensure ALGO balance
      const algoBalance = await getAlgoBalance(user.walletAddress);
      console.log("💰 Algo balance:", algoBalance.toString());

      if (algoBalance < 200_000n) {
        console.log("⚠️ Low ALGO → funding...");
        await airdropAlgo(user.walletAddress);
      }

      // STEP 2: Ensure opt-in
      if (user.walletType === 'CUSTODIAL' && user.encryptedMnemonic) {
        const client = getCustodialClient(user.encryptedMnemonic);

        console.log("🔗 Ensuring USDC opt-in...");
        await client.ensureAssetOptIn(USDC_ASSET_ID);
      }

      // STEP 3: Airdrop USDC (MAIN FAILURE POINT)
      console.log(`🚀 Sending ${amount} USDC...`);
      const txId = await airdropUsdc(user.walletAddress, amount);

      console.log("✅ TX SUCCESS:", txId);

      // Record Activity in Database
      const amountMicroUsdc = BigInt(Math.floor(Number(amount) * 1_000_000));
      await prisma.activityLog.create({
        data: {
          transactionId: txId,
          userId,
          type: 'DEPOSIT',
          amount: amountMicroUsdc
        }
      });

      return res.json({
        success: true,
        txId,
        message: `${amount} USDC added successfully`
      });

    } catch (blockchainError: any) {
      console.error("🔥 Blockchain error:", blockchainError);

      // Record SIMULATED Activity so UI updates for user
      const amountMicroUsdc = BigInt(Math.floor(Number(amount) * 1_000_000));
      const simTxId = `SIM_${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      await prisma.activityLog.create({
        data: {
          transactionId: simTxId,
          userId,
          type: 'DEPOSIT',
          amount: amountMicroUsdc
        }
      });

      // SAFE fallback (IMPORTANT)
      return res.status(200).json({
        success: true, // Changed to true so frontend onFunded() triggers
        txId: simTxId,
        message: "Blockchain currently busy — simulated deposit added",
        warning: blockchainError.message
      });
    }

  } catch (error: any) {
    console.error("🔥 Server error:", error);

    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/wallet/withdraw - Simulated USDC Withdrawal (Off-ramp Demo)
router.post('/withdraw', async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: 'User ID and amount are required' });
    }

    // ── Compute free wallet balance from ActivityLog ──────────────────────
    const activities = await prisma.activityLog.findMany({ where: { userId } });
    let freeBalance = 0n;
    for (const a of activities) {
      const type = a.type.toUpperCase();
      const amt = a.amount || 0n;
      if (type === 'PURCHASE' || (type === 'DEPOSIT' && a.onChainGoalId === null)) {
        freeBalance += amt;
      } else if (type === 'WITHDRAWAL' && a.onChainGoalId === null) {
        freeBalance -= amt;
      } else if ((type === 'DEPOSIT' && a.onChainGoalId !== null) || type === 'AUTOPAY_SUCCESS') {
        freeBalance -= amt;
      } else if (type === 'GOAL_WITHDRAWAL' || (type === 'WITHDRAWAL' && a.onChainGoalId !== null)) {
        freeBalance += amt;
      }
    }

    const requestedMicroUsdc = BigInt(Math.floor(Number(amount) * 1_000_000));
    if (requestedMicroUsdc > freeBalance) {
      const maxUsdc = Number(freeBalance) / 1_000_000;
      return res.status(400).json({
        error: `Insufficient balance. Your current free balance is ${maxUsdc.toFixed(2)} USDC.`
      });
    }
    // ─────────────────────────────────────────────────────────────────────

    try {
      // Perform the on-chain transfer from User to Platform
      const txId = await withdrawUsdc(userId, Number(amount));

      // Record Activity in Database
      const amountMicroUsdc = BigInt(Math.floor(Number(amount) * 1_000_000));
      await prisma.activityLog.create({
        data: {
          transactionId: txId,
          userId,
          type: 'withdrawal',
          amount: amountMicroUsdc
        }
      });

      return res.status(200).json({ 
        success: true, 
        txId, 
        message: `Successfully withdrawn ${amount} USDC` 
      });

    } catch (blockchainError: any) {
      console.error("🔥 Blockchain Withdrawal error:", blockchainError);
      
      // Simulated Fallback for demo
      const simTxId = `SIM_WITHDRAW_${Math.random().toString(36).substring(7).toUpperCase()}`;
      const amountMicroUsdc = BigInt(Math.floor(Number(amount) * 1_000_000));
      
      await prisma.activityLog.create({
        data: {
          transactionId: simTxId,
          userId,
          type: 'withdrawal',
          amount: amountMicroUsdc
        }
      });

      return res.status(200).json({
        success: true,
        txId: simTxId,
        message: "Simulation: Withdrawal processed off-chain",
        warning: blockchainError.message
      });
    }
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: error.message || 'Withdrawal failed' });
  }
});

export default router;
