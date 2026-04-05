import express from 'express';
import { getExchangeRate } from '../lib/market';

const router = express.Router();

/**
 * GET /api/market/exchange-rate
 * Returns the current USD/INR exchange rate.
 */
router.get('/exchange-rate', async (req, res) => {
  try {
    const rate = await getExchangeRate();
    res.json({ rate });
  } catch (error: any) {
    console.error('Market route error:', error.message);
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
});

export default router;
