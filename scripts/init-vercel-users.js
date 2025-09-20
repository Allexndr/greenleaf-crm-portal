const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Получаем строку подключения из переменных окружения
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'greenleaf';

if (!uri) {
  console.error('❌ MONGODB_URI не установлена в переменных окружения');
  process.exit(1);
}

async function initVercelUsers() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔌 Подключение к MongoDB Atlas...');
    await client.connect();
    console.log('✅ Подключение успешно!');
    
    const db = client.db(dbName);
    
    // Создаем коллекции если их нет
    await db.createCollection('users');
    await db.createCollection('service_centers');
    await db.createCollection('applications');
    await db.createCollection('audit_logs');
    await db.createCollection('system_settings');
    console.log('✅ Коллекции созданы');
    
    // Создаем индексы
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('service_centers').createIndex({ number: 1 }, { unique: true });
    await db.collection('applications').createIndex({ applicationNumber: 1 }, { unique: true });
    await db.collection('applications').createIndex({ serviceCenterId: 1 });
    await db.collection('applications').createIndex({ status: 1 });
    await db.collection('audit_logs').createIndex({ userId: 1 });
    await db.collection('audit_logs').createIndex({ createdAt: -1 });
    await db.collection('system_settings').createIndex({ key: 1 }, { unique: true });
    console.log('✅ Индексы созданы');
    
    // Удаляем старых пользователей
    await db.collection('users').deleteMany({});
    console.log('🗑️ Старые пользователи удалены');
    
    // Создаем админа
    const usersCollection = db.collection('users');
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
    console.log('✅ Админ создан: admin@greenleaf.kz / admin123');
    
    // Создаем сервисный центр
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
    
    await serviceCentersCollection.deleteMany({});
    const serviceCenterResult = await serviceCentersCollection.insertOne(serviceCenter);
    console.log('✅ Сервисный центр создан');
    
    // Создаем менеджера
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
    console.log('✅ Менеджер создан: manager@greenleaf.kz / manager123');
    
    // Создаем системные настройки
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
    
    await systemSettingsCollection.deleteMany({});
    await systemSettingsCollection.insertMany(settings);
    console.log('✅ Системные настройки созданы');
    
    console.log('\n🎉 ИНИЦИАЛИЗАЦИЯ VERCEL ЗАВЕРШЕНА!');
    console.log('\nДоступы для входа:');
    console.log('Администратор: admin@greenleaf.kz / admin123');
    console.log('Менеджер: manager@greenleaf.kz / manager123');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.log('\n🔧 Проверьте:');
    console.log('1. MONGODB_URI установлена в переменных окружения Vercel');
    console.log('2. Пользователь базы данных создан в MongoDB Atlas');
    console.log('3. Сетевой доступ настроен (0.0.0.0/0)');
  } finally {
    await client.close();
  }
}

initVercelUsers();
