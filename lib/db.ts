import { PrismaClient } from '@prisma/client';
import { prismaBuild } from './prisma-build';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if we're in build mode
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL;

// Create Prisma client with error handling
const createPrismaClient = () => {
  if (isBuildTime) {
    console.log('Using mock Prisma client for build time');
    return prismaBuild as any;
  }

  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (error) {
    console.error('Failed to create Prisma client:', error);
    return prismaBuild as any;
  }
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

