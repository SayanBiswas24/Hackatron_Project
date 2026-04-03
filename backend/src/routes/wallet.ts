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
  airdropUsdc 
} from '../lib/blockchain';

const router = express.Router();

// POST /api/wallet/setup - Handle one-time wallet setup during onboarding
router.post('/setup', async (req, res) => {
  try {
    const { userId, type, mnemonic, walletAddress } = req.body;

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
        onboardingComplete: true
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
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.walletAddress) {
      return res.status(404).json({ error: 'User or wallet not found' });
    }

    const algoBalance = await getAlgoBalance(user.walletAddress);
    const usdcBalance = await getUsdcBalance(user.walletAddress);

    res.json({
      address: user.walletAddress,
      algo: algoBalance.toString(),
      usdc: usdcBalance.toString()
    });
  } catch (error: any) {
    console.error('Balance fetch error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
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
    
    // Simulate payment processing delay (2 seconds)
    console.log(`💳 Simulating ${paymentMethod} payment of $${amount} for user ${userId}...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.walletAddress) {
      return res.status(404).json({ error: 'User wallet not found' });
    }

    // On LocalNet/Demo, we could skip strict cooldowns or keep them
    console.log(`✅ Payment successful. Airdropping ${amount} USDC to ${user.walletAddress}...`);
    const txId = await airdropUsdc(user.walletAddress, amount);

    // Also update cooldown for consistency
    await prisma.user.update({
      where: { id: userId },
      data: { lastFaucetAt: new Date() }
    });

    res.json({ 
      success: true, 
      txId, 
      message: `${amount} USDC purchased and delivered to vault.` 
    });
  } catch (error: any) {
    console.error('Purchase simulation error:', error);
    res.status(500).json({ error: error.message || 'Simulation failed' });
  }
});

export default router;
