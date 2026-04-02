import express from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

const router = express.Router();

// GET /api/users/:userId - Retrieve user profile by internal ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        goals: true,
        activities: {
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/signup - Create new user
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        displayName: fullName?.split(' ')[0] || 'User',
      }
    });

    res.status(201).json({ 
      message: 'User created successfully',
      userId: user.id,
      fullName: user.fullName,
      onboardingComplete: user.onboardingComplete
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/signin - Verify credentials
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      userId: user.id,
      displayName: user.displayName,
      fullName: user.fullName,
      onboardingComplete: user.onboardingComplete,
      walletType: user.walletType
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
