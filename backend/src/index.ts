import 'dotenv/config'; // ✅ BEST FIX

import express from 'express';
import cors from 'cors';

import userRoutes from './routes/users';
import goalRoutes from './routes/goals';
import activityRoutes from './routes/activity';
import walletRoutes from './routes/wallet';

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
  console.log(`Backend running on port ${port}`);
});