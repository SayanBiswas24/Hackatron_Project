import express from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

// GET /api/analytics/snapshot/:userId - Returns real-time financial snapshots and history
router.get('/snapshot/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [user, goals, activities] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.goalMetadata.findMany({ where: { userId } }),
      prisma.activityLog.findMany({ 
        where: { userId },
        orderBy: { timestamp: 'asc' }
      })
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 1. Calculate Real-time Metrics
    const totalDepositedUsdc = goals.reduce((acc, g) => acc + (Number(g.currentBalance) / 1000000), 0);
    const totalTargetUsdc = goals.reduce((acc, g) => acc + (Number(g.targetAmount) / 1000000), 0);
    const avgProgress = totalTargetUsdc > 0 ? Math.round((totalDepositedUsdc / totalTargetUsdc) * 100) : 0;

    // 2. Calculate Total Yield (Real rewards logged in DB)
    const yieldActivities = activities.filter(a => 
      ['INCENTIVE', 'COMPLETION_REWARD', 'INTEREST', 'BONUS'].includes(a.type.toUpperCase())
    );
    const totalYieldUsdc = yieldActivities.reduce((acc, a) => acc + (Number(a.amount || 0) / 1000000), 0);

    // 3. Historical Data Generator (Last 6 Months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const performanceHistory = [];
    
    // We'll generate 6 data points ending at current month
    for (let i = 5; i >= 0; i--) {
      let mIdx = currentMonth - i;
      let year = currentYear;
      if (mIdx < 0) {
        mIdx += 12;
        year -= 1;
      }

      // Filter activities up to the end of this month
      const endOfMonth = new Date(year, mIdx + 1, 0, 23, 59, 59);
      const snapshotActivities = activities.filter(a => new Date(a.timestamp) <= endOfMonth);

      let cumulativeSavings = 0;
      let cumulativeYield = 0;

      snapshotActivities.forEach(a => {
        const type = a.type.toUpperCase();
        const amt = Number(a.amount || 0) / 1000000;

        if (['DEPOSIT', 'PURCHASE'].includes(type) && a.onChainGoalId === null) {
          cumulativeSavings += amt;
        } else if (['WITHDRAWAL'].includes(type) && a.onChainGoalId === null) {
          cumulativeSavings -= amt;
        } else if (['INCENTIVE', 'COMPLETION_REWARD', 'INTEREST', 'BONUS'].includes(type)) {
          cumulativeYield += amt;
        }
      });

      performanceHistory.push({
        name: months[mIdx],
        year,
        savings: Math.round(cumulativeSavings * 88.50), // Standard INR rate
        yield: Math.round(cumulativeYield * 88.50)
      });
    }

    // 4. Distribution Data
    const distribution = goals.map(g => ({
      name: g.title,
      value: Number(g.currentBalance) / 1000000,
      color: g.colorHex || '#C0FF00'
    }));

    res.json({
      metrics: {
        totalCapitalUsdc: totalDepositedUsdc,
        totalYieldUsdc,
        avgProgress,
        goalCount: goals.length,
        apy: user.governanceEnabled ? 8.4 : 0.5
      },
      history: performanceHistory,
      distribution
    });

  } catch (error: any) {
    console.error('Analytics engine error:', error);
    res.status(500).json({ error: 'Failed to generate analytics snapshot' });
  }
});

export default router;
