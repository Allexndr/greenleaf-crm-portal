const { MongoClient } = require('mongodb');

// Замените на вашу строку подключения после создания пользователя
const uri = process.env.MONGODB_URI || "mongodb+srv://greenleaf_user:Greenleaf2024!@cluster0.aism76i.mongodb.net/greenleaf?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('greenleaf');
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections:', collections.map(c => c.name));
    
    // Test ping
    await db.admin().ping();
    console.log('🏓 Ping successful');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Убедитесь что:');
    console.log('1. Создан пользователь базы данных в MongoDB Atlas');
    console.log('2. Настроен сетевой доступ (0.0.0.0/0)');
    console.log('3. Строка подключения корректна');
  } finally {
    await client.close();
  }
}

testConnection();
