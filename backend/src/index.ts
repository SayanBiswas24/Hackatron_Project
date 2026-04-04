import 'dotenv/config'; // ✅ BEST FIX

import express from 'express';
import cors from 'cors';

import userRoutes from './routes/users';
import goalRoutes from './routes/goals';
import activityRoutes from './routes/activity';
import walletRoutes from './routes/wallet';
import { processScheduledAutopays } from './lib/autopay';

// Debug env
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("PORT:", process.env.PORT);

// BigInt fix
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`🚀 PennyStalker Backend running at http://localhost:${port}`);
  
  // Initialize Autopay Scheduler (Runs every hour)
  const AUTOPAY_INTERVAL = 1000 * 60 * 60; // 1 hour
  setInterval(() => {
    processScheduledAutopays().catch(err => console.error('❌ Scheduler Error:', err));
  }, AUTOPAY_INTERVAL);

  // Immediate check on startup (optional but helpful for testing)
  processScheduledAutopays().catch(err => console.error('❌ Initial Autopay Check Error:', err));
});