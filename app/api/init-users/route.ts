import { NextRequest } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'greenleaf';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!uri) {
      return Response.json({ error: 'MONGODB_URI не установлена' }, { status: 500 });
    }

    const client = new MongoClient(uri);
    
    try {
      await client.connect();
      console.log('✅ Подключение к MongoDB Atlas успешно');
      
      const db = client.db(dbName);
      
      // Создаем коллекции если их нет
      await db.createCollection('users');
      await db.createCollection('service_centers');
      await db.createCollection('applications');
      await db.createCollection('audit_logs');
      await db.createCollection('system_settings');
      
      // Создаем индексы
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('service_centers').createIndex({ number: 1 }, { unique: true });
      await db.collection('applications').createIndex({ applicationNumber: 1 }, { unique: true });
      await db.collection('applications').createIndex({ serviceCenterId: 1 });
      await db.collection('applications').createIndex({ status: 1 });
      await db.collection('audit_logs').createIndex({ userId: 1 });
      await db.collection('audit_logs').createIndex({ createdAt: -1 });
      await db.collection('system_settings').createIndex({ key: 1 }, { unique: true });
      
      // Удаляем старых пользователей
      await db.collection('users').deleteMany({});
      
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
      
      return Response.json({ 
        success: true, 
        message: 'Пользователи успешно созданы',
        users: {
          admin: 'admin@greenleaf.kz / admin123',
          manager: 'manager@greenleaf.kz / manager123'
        }
      });
      
    } finally {
      await client.close();
    }
    
  } catch (error) {
    console.error('Ошибка инициализации пользователей:', error);
    return Response.json({ 
      error: 'Ошибка инициализации пользователей',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
