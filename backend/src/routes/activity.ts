import express from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

// GET /api/activity/:userId - Fetches recent activities for a specific user ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const activities = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 20 // Return top 20 recent actions
    });

    // Map BigInts for JSON serialization
    res.json(activities.map((a: any) => ({
      ...a,
      amount: a.amount ? a.amount.toString() : null
    })));
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/activity - Logs a new transaction event linked to a user ID
router.post('/', async (req, res) => {
  try {
    const { transactionId, userId, onChainGoalId, type, amount } = req.body;

    if (!transactionId || !userId || !type) {
      return res.status(400).json({ error: 'Missing required fields: transactionId, userId, and type' });
    }

    const activity = await prisma.activityLog.create({
      data: {
        transactionId,
        userId,
        onChainGoalId: onChainGoalId !== undefined ? onChainGoalId : null,
        type,
        amount: amount !== undefined ? BigInt(Math.round(Number(amount))) : null
      }
    });

    res.status(201).json({
      ...activity,
      amount: activity.amount ? activity.amount.toString() : null
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
