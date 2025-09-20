const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI || "mongodb+srv://sanmemik2000:tgDP9U6B5v95gzJ4@cluster0.aism76i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = process.env.MONGODB_DB || "greenleaf";

async function initUsers() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(dbName);
    
    // Check if users already exist
    const usersCollection = db.collection('users');
    const existingUsers = await usersCollection.countDocuments();
    
    if (existingUsers > 0) {
      console.log('✅ Users already exist, skipping initialization');
      return;
    }
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = {
      email: 'admin@greenleaf.kz',
      password: adminPassword,
      role: 'SITE_ADMIN',
      serviceCenterId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await usersCollection.insertOne(adminUser);
    console.log('✅ Admin user created: admin@greenleaf.kz / admin123');
    
    // Create service center
    const serviceCentersCollection = db.collection('service_centers');
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
    console.log('✅ Manager user created: manager@greenleaf.kz / manager123');
    
    // Create system settings
    const systemSettingsCollection = db.collection('system_settings');
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
    
  } catch (error) {
    console.error('❌ Error initializing MongoDB:', error.message);
    console.log('\n🔧 Убедитесь что:');
    console.log('1. Создан пользователь базы данных в MongoDB Atlas');
    console.log('2. Настроен сетевой доступ (0.0.0.0/0)');
    console.log('3. Строка подключения корректна');
  } finally {
    await client.close();
  }
}

initUsers();
