import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://sanmemik2000:26QMCmGwIwPsebvp@cluster0.aism76i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = process.env.MONGODB_DB || "greenleaf";

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (client && db) {
    return { client, db };
  }

  try {
    client = new MongoClient(uri, {
      serverApi: {
        version: '1' as any,
        strict: true,
        deprecationErrors: true,
      }
    });

    await client.connect();
    db = client.db(dbName);
    
    console.log('Connected to MongoDB Atlas');
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function getDatabase() {
  if (!db) {
    await connectToDatabase();
  }
  return db;
}

export async function closeConnection() {
  if (client) {
    await client.close();
  }
}
