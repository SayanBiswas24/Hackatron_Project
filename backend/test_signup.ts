import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function testSignup() {
  const fullName = 'Test User';
  const email = 'test' + Math.random() + '@example.com';
  const password = 'password123';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        displayName: fullName?.split(' ')[0] || 'User',
      }
    });
    console.log('User created:', user.id);
  } catch (error) {
    console.error('Test signup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSignup();
