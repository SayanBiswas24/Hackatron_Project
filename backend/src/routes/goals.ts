import express from 'express';
import { prisma } from '../lib/prisma';

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

export default router;
