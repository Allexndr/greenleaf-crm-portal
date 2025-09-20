import { getDatabase } from './mongodb';

// MongoDB collections
export const collections = {
  users: 'users',
  serviceCenters: 'service_centers',
  applications: 'applications',
  applicationHistory: 'application_history',
  auditLogs: 'audit_logs',
  systemSettings: 'system_settings',
};

// MongoDB Prisma-like interface
export class MongoDBPrisma {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  get user() {
    return {
      findMany: async (options: any = {}) => {
        const collection = this.db.collection(collections.users);
        let query = {};
        let sort = {};
        let limit = 0;
        let skip = 0;

        if (options.where) {
          query = this.convertPrismaWhere(options.where);
        }

        if (options.orderBy) {
          sort = this.convertPrismaOrderBy(options.orderBy);
        }

        if (options.take) {
          limit = options.take;
        }

        if (options.skip) {
          skip = options.skip;
        }

        const cursor = collection.find(query).sort(sort).skip(skip);
        if (limit > 0) {
          cursor.limit(limit);
        }

        const results = await cursor.toArray();

        if (options.include) {
          return this.populateIncludes(results, options.include);
        }

        return results;
      },

      findUnique: async (options: any) => {
        const collection = this.db.collection(collections.users);
        const query = this.convertPrismaWhere(options.where);
        const result = await collection.findOne(query);
        
        if (result && options.include) {
          return this.populateIncludes([result], options.include)[0];
        }
        
        return result;
      },

      create: async (options: any) => {
        const collection = this.db.collection(collections.users);
        const data = {
          ...options.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const result = await collection.insertOne(data);
        return { ...data, id: result.insertedId.toString() };
      },

      update: async (options: any) => {
        const collection = this.db.collection(collections.users);
        const query = this.convertPrismaWhere(options.where);
        const data = {
          ...options.data,
          updatedAt: new Date(),
        };
        await collection.updateOne(query, { $set: data });
        return await collection.findOne(query);
      },

      delete: async (options: any) => {
        const collection = this.db.collection(collections.users);
        const query = this.convertPrismaWhere(options.where);
        await collection.deleteOne(query);
        return { message: 'User deleted' };
      },

      count: async (options: any = {}) => {
        const collection = this.db.collection(collections.users);
        const query = options.where ? this.convertPrismaWhere(options.where) : {};
        return await collection.countDocuments(query);
      },
    };
  }

  get serviceCenter() {
    return {
      findMany: async (options: any = {}) => {
        const collection = this.db.collection(collections.serviceCenters);
        let query = {};
        let sort = {};
        let limit = 0;
        let skip = 0;

        if (options.where) {
          query = this.convertPrismaWhere(options.where);
        }

        if (options.orderBy) {
          sort = this.convertPrismaOrderBy(options.orderBy);
        }

        if (options.take) {
          limit = options.take;
        }

        if (options.skip) {
          skip = options.skip;
        }

        const cursor = collection.find(query).sort(sort).skip(skip);
        if (limit > 0) {
          cursor.limit(limit);
        }

        const results = await cursor.toArray();

        if (options.include) {
          return this.populateIncludes(results, options.include);
        }

        return results;
      },

      findUnique: async (options: any) => {
        const collection = this.db.collection(collections.serviceCenters);
        const query = this.convertPrismaWhere(options.where);
        const result = await collection.findOne(query);
        
        if (result && options.include) {
          return this.populateIncludes([result], options.include)[0];
        }
        
        return result;
      },

      create: async (options: any) => {
        const collection = this.db.collection(collections.serviceCenters);
        const data = {
          ...options.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const result = await collection.insertOne(data);
        return { ...data, id: result.insertedId.toString() };
      },

      update: async (options: any) => {
        const collection = this.db.collection(collections.serviceCenters);
        const query = this.convertPrismaWhere(options.where);
        const data = {
          ...options.data,
          updatedAt: new Date(),
        };
        await collection.updateOne(query, { $set: data });
        return await collection.findOne(query);
      },

      delete: async (options: any) => {
        const collection = this.db.collection(collections.serviceCenters);
        const query = this.convertPrismaWhere(options.where);
        await collection.deleteOne(query);
        return { message: 'Service center deleted' };
      },

      count: async (options: any = {}) => {
        const collection = this.db.collection(collections.serviceCenters);
        const query = options.where ? this.convertPrismaWhere(options.where) : {};
        return await collection.countDocuments(query);
      },
    };
  }

  get application() {
    return {
      findMany: async (options: any = {}) => {
        const collection = this.db.collection(collections.applications);
        let query = {};
        let sort = {};
        let limit = 0;
        let skip = 0;

        if (options.where) {
          query = this.convertPrismaWhere(options.where);
        }

        if (options.orderBy) {
          sort = this.convertPrismaOrderBy(options.orderBy);
        }

        if (options.take) {
          limit = options.take;
        }

        if (options.skip) {
          skip = options.skip;
        }

        const cursor = collection.find(query).sort(sort).skip(skip);
        if (limit > 0) {
          cursor.limit(limit);
        }

        const results = await cursor.toArray();

        if (options.include) {
          return this.populateIncludes(results, options.include);
        }

        return results;
      },

      findUnique: async (options: any) => {
        const collection = this.db.collection(collections.applications);
        const query = this.convertPrismaWhere(options.where);
        const result = await collection.findOne(query);
        
        if (result && options.include) {
          return this.populateIncludes([result], options.include)[0];
        }
        
        return result;
      },

      create: async (options: any) => {
        const collection = this.db.collection(collections.applications);
        const data = {
          ...options.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const result = await collection.insertOne(data);
        return { ...data, id: result.insertedId.toString() };
      },

      update: async (options: any) => {
        const collection = this.db.collection(collections.applications);
        const query = this.convertPrismaWhere(options.where);
        const data = {
          ...options.data,
          updatedAt: new Date(),
        };
        await collection.updateOne(query, { $set: data });
        return await collection.findOne(query);
      },

      delete: async (options: any) => {
        const collection = this.db.collection(collections.applications);
        const query = this.convertPrismaWhere(options.where);
        await collection.deleteOne(query);
        return { message: 'Application deleted' };
      },

      count: async (options: any = {}) => {
        const collection = this.db.collection(collections.applications);
        const query = options.where ? this.convertPrismaWhere(options.where) : {};
        return await collection.countDocuments(query);
      },

      groupBy: async (options: any) => {
        const collection = this.db.collection(collections.applications);
        const pipeline = [
          { $match: options.where ? this.convertPrismaWhere(options.where) : {} },
          { $group: { _id: `$${options.by}`, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ];

        if (options.take) {
          pipeline.push({ $limit: options.take });
        }

        return await collection.aggregate(pipeline).toArray();
      },
    };
  }

  get auditLog() {
    return {
      findMany: async (options: any = {}) => {
        const collection = this.db.collection(collections.auditLogs);
        let query = {};
        let sort = {};
        let limit = 0;
        let skip = 0;

        if (options.where) {
          query = this.convertPrismaWhere(options.where);
        }

        if (options.orderBy) {
          sort = this.convertPrismaOrderBy(options.orderBy);
        }

        if (options.take) {
          limit = options.take;
        }

        if (options.skip) {
          skip = options.skip;
        }

        const cursor = collection.find(query).sort(sort).skip(skip);
        if (limit > 0) {
          cursor.limit(limit);
        }

        const results = await cursor.toArray();

        if (options.include) {
          return this.populateIncludes(results, options.include);
        }

        return results;
      },

      create: async (options: any) => {
        const collection = this.db.collection(collections.auditLogs);
        const data = {
          ...options.data,
          createdAt: new Date(),
        };
        const result = await collection.insertOne(data);
        return { ...data, id: result.insertedId.toString() };
      },

      groupBy: async (options: any) => {
        const collection = this.db.collection(collections.auditLogs);
        const pipeline = [
          { $match: options.where ? this.convertPrismaWhere(options.where) : {} },
          { $group: { _id: `$${options.by}`, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ];

        if (options.take) {
          pipeline.push({ $limit: options.take });
        }

        return await collection.aggregate(pipeline).toArray();
      },
    };
  }

  get systemSettings() {
    return {
      findMany: async (options: any = {}) => {
        const collection = this.db.collection(collections.systemSettings);
        let query = {};
        let sort = {};

        if (options.where) {
          query = this.convertPrismaWhere(options.where);
        }

        if (options.orderBy) {
          sort = this.convertPrismaOrderBy(options.orderBy);
        }

        const cursor = collection.find(query).sort(sort);
        return await cursor.toArray();
      },

      findUnique: async (options: any) => {
        const collection = this.db.collection(collections.systemSettings);
        const query = this.convertPrismaWhere(options.where);
        return await collection.findOne(query);
      },

      create: async (options: any) => {
        const collection = this.db.collection(collections.systemSettings);
        const data = {
          ...options.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const result = await collection.insertOne(data);
        return { ...data, id: result.insertedId.toString() };
      },

      update: async (options: any) => {
        const collection = this.db.collection(collections.systemSettings);
        const query = this.convertPrismaWhere(options.where);
        const data = {
          ...options.data,
          updatedAt: new Date(),
        };
        await collection.updateOne(query, { $set: data });
        return await collection.findOne(query);
      },

      upsert: async (options: any) => {
        const collection = this.db.collection(collections.systemSettings);
        const query = this.convertPrismaWhere(options.where);
        const data = {
          ...options.data,
          updatedAt: new Date(),
        };
        
        const result = await collection.findOneAndUpdate(
          query,
          { $set: data },
          { upsert: true, returnDocument: 'after' }
        );
        
        return result;
      },
    };
  }

  get applicationHistory() {
    return {
      create: async (options: any) => {
        const collection = this.db.collection(collections.applicationHistory);
        const data = {
          ...options.data,
          createdAt: new Date(),
        };
        const result = await collection.insertOne(data);
        return { ...data, id: result.insertedId.toString() };
      },
    };
  }

  // Helper methods
  private convertPrismaWhere(where: any): any {
    if (!where) return {};
    
    const mongoQuery: any = {};
    
    for (const [key, value] of Object.entries(where)) {
      if (key === 'id') {
        mongoQuery._id = value;
      } else if (typeof value === 'object' && value !== null) {
        if (value.in) {
          mongoQuery[key] = { $in: value.in };
        } else if (value.gte) {
          mongoQuery[key] = { $gte: value.gte };
        } else if (value.lte) {
          mongoQuery[key] = { $lte: value.lte };
        } else if (value.not) {
          mongoQuery[key] = { $ne: value.not };
        } else {
          mongoQuery[key] = value;
        }
      } else {
        mongoQuery[key] = value;
      }
    }
    
    return mongoQuery;
  }

  private convertPrismaOrderBy(orderBy: any): any {
    if (!orderBy) return {};
    
    const mongoSort: any = {};
    
    if (typeof orderBy === 'object') {
      for (const [key, value] of Object.entries(orderBy)) {
        mongoSort[key] = value === 'desc' ? -1 : 1;
      }
    }
    
    return mongoSort;
  }

  private async populateIncludes(results: any[], includes: any): Promise<any[]> {
    // Simple implementation - in production you'd want more sophisticated population
    return results;
  }
}

// Global MongoDB Prisma instance
let mongoPrisma: MongoDBPrisma;

export async function getMongoPrisma() {
  if (!mongoPrisma) {
    const db = await getDatabase();
    mongoPrisma = new MongoDBPrisma(db);
  }
  return mongoPrisma;
}
