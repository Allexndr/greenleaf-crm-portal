// Mock Prisma client for build time
export const prismaBuild = {
  $connect: () => Promise.resolve(),
  $disconnect: () => Promise.resolve(),
  application: {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
    groupBy: () => Promise.resolve([]),
    count: () => Promise.resolve(0),
  },
  user: {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  },
  serviceCenter: {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  },
  auditLog: {
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    groupBy: () => Promise.resolve([]),
  },
  systemSettings: {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
  },
  applicationHistory: {
    create: () => Promise.resolve({}),
  },
};
