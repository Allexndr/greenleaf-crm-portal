import { PrismaClient } from '@prisma/client';
import { prismaBuild } from './prisma-build';
import { getMongoPrisma } from './prisma-mongodb';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if we're in build mode
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL;

// Check if we should use MongoDB
const useMongoDB = process.env.NODE_ENV === 'production' && process.env.MONGODB_URI;

// Create Prisma client with error handling
const createPrismaClient = () => {
  if (isBuildTime) {
    console.log('Using mock Prisma client for build time');
    return prismaBuild as any;
  }

  if (useMongoDB) {
    console.log('Using MongoDB for production');
    return getMongoPrisma();
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

