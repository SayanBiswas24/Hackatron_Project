import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/users';
import goalRoutes from './routes/goals';
import activityRoutes from './routes/activity';
import walletRoutes from './routes/wallet';

dotenv.config();

// Standard BigInt JSON serialization fix
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend server is running on port ${port}`);
});
