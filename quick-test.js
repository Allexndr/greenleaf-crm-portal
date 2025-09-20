const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Используйте вашу строку подключения
const uri = "mongodb+srv://sanmemik2000:tgDP9U6B5v95gzJ4@cluster0.aism76i.mongodb.net/greenleaf?retryWrites=true&w=majority&appName=Cluster0";

async function quickTest() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔌 Подключение к MongoDB...');
    await client.connect();
    console.log('✅ Подключение успешно!');
    
    const db = client.db('greenleaf');
    
    // Создаем коллекции если их нет
    await db.createCollection('users');
    await db.createCollection('service_centers');
    await db.createCollection('applications');
    await db.createCollection('audit_logs');
    await db.createCollection('system_settings');
    console.log('✅ Коллекции созданы');
    
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
    
    // Удаляем старых пользователей
    await usersCollection.deleteMany({});
    
    // Создаем нового админа
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
    
    console.log('\n🎉 ГОТОВО! Теперь можно войти в админ панель:');
    console.log('http://localhost:3000/admin/login');
    console.log('\nДоступы:');
    console.log('Админ: admin@greenleaf.kz / admin123');
    console.log('Менеджер: manager@greenleaf.kz / manager123');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.log('\n🔧 Проверьте:');
    console.log('1. Создан ли пользователь greenleaf_user в MongoDB Atlas');
    console.log('2. Настроен ли сетевой доступ (0.0.0.0/0)');
    console.log('3. Правильный ли пароль в строке подключения');
  } finally {
    await client.close();
  }
}

quickTest();
