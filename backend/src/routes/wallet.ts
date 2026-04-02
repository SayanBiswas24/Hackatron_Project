import express from 'express';
import algosdk from 'algosdk';
import { prisma } from '../lib/prisma';
import { encrypt } from '../lib/crypto';

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

export default router;
