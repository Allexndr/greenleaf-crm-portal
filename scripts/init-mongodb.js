const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb+srv://sanmemik2000:tgDP9U6B5v95gzJ4@cluster0.aism76i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = process.env.MONGODB_DB || "greenleaf";

async function initMongoDB() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db(dbName);
    
    // Create collections
    await db.createCollection('users');
    await db.createCollection('service_centers');
    await db.createCollection('applications');
    await db.createCollection('application_history');
    await db.createCollection('audit_logs');
    await db.createCollection('system_settings');
    
    console.log('Collections created successfully');
    
    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('service_centers').createIndex({ number: 1 }, { unique: true });
    await db.collection('applications').createIndex({ applicationNumber: 1 }, { unique: true });
    await db.collection('applications').createIndex({ serviceCenterId: 1 });
    await db.collection('applications').createIndex({ status: 1 });
    await db.collection('audit_logs').createIndex({ userId: 1 });
    await db.collection('audit_logs').createIndex({ createdAt: -1 });
    await db.collection('system_settings').createIndex({ key: 1 }, { unique: true });
    
    console.log('Indexes created successfully');
    
    // Insert default data
    const usersCollection = db.collection('users');
    const serviceCentersCollection = db.collection('service_centers');
    const systemSettingsCollection = db.collection('system_settings');
    
    // Check if data already exists
    const existingUsers = await usersCollection.countDocuments();
    if (existingUsers === 0) {
      // Create default admin user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const adminUser = {
        email: 'admin@greenleaf.kz',
        password: hashedPassword,
        role: 'SITE_ADMIN',
        serviceCenterId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await usersCollection.insertOne(adminUser);
      console.log('✅ Admin user created');
      
      // Create default service center
      const serviceCenter = {
        number: 'S240350',
        description: 'Сервисный центр Алматы',
        address: 'г. Алматы, ул. Абая, 1',
        uniqueLink: 'registergreenleaf.kz/S240350',
        greenleafLogin: '',
        greenleafPassword: '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const serviceCenterResult = await serviceCentersCollection.insertOne(serviceCenter);
      console.log('✅ Service center created');
      
      // Create manager user
      const managerPassword = await bcrypt.hash('manager123', 12);
      const managerUser = {
        email: 'manager@greenleaf.kz',
        password: managerPassword,
        role: 'MANAGER',
        serviceCenterId: serviceCenterResult.insertedId.toString(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await usersCollection.insertOne(managerUser);
      console.log('✅ Manager user created');
      
      // Create system settings
      const settings = [
        {
          key: 'DEFAULT_TEMP_PASSWORD',
          value: 'Aa12345',
          description: 'Временный пароль по умолчанию',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          key: 'GREENLEAF_API_KEY',
          value: '',
          description: 'API ключ Greenleaf',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          key: 'GREENLEAF_API_URL',
          value: 'https://greenleaf-global.com/api',
          description: 'URL API Greenleaf',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          key: 'MAX_FILE_SIZE',
          value: '5242880',
          description: 'Максимальный размер файла (байт)',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          key: 'MAX_LOGIN_ATTEMPTS',
          value: '5',
          description: 'Максимум попыток входа',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          key: 'PROCESSING_INTERVAL',
          value: '30000',
          description: 'Интервал обработки очереди (мс)',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          key: 'SESSION_TIMEOUT',
          value: '24',
          description: 'Таймаут сессии (часы)',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      await systemSettingsCollection.insertMany(settings);
      console.log('✅ System settings created');
      
      console.log('\n🎉 MongoDB initialization completed!');
      console.log('\nДоступы для входа:');
      console.log('Администратор: admin@greenleaf.kz / admin123');
      console.log('Менеджер: manager@greenleaf.kz / manager123');
      console.log(`\nТестовая ссылка: https://your-domain.vercel.app/?sc=${serviceCenterResult.insertedId.toString()}`);
    } else {
      console.log('✅ Database already initialized');
    }
    
  } catch (error) {
    console.error('Error initializing MongoDB:', error);
  } finally {
    await client.close();
  }
}

initMongoDB();
