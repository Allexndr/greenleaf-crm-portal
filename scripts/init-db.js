const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Инициализация базы данных...');

  // Создаем первого администратора сайта
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@greenleaf.kz' },
    update: {},
    create: {
      email: 'admin@greenleaf.kz',
      password: hashedPassword,
      role: 'SITE_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Администратор создан:', admin.email);

  // Создаем тестовый сервисный центр
  const serviceCenter = await prisma.serviceCenter.upsert({
    where: { number: 'S240350' },
    update: {},
    create: {
      number: 'S240350',
      description: 'Сервисный центр Алматы',
      address: 'г. Алматы, ул. Абая, 150',
      uniqueLink: 'registergreenleaf.kz/S240350',
      greenleafLogin: 'admin_5240350',
      greenleafPassword: 'temp_password_123',
      isActive: true,
    },
  });

  console.log('✅ Сервисный центр создан:', serviceCenter.number);

  // Создаем тестового менеджера
  const managerPassword = await bcrypt.hash('manager123', 12);
  
  const manager = await prisma.user.upsert({
    where: { email: 'manager@greenleaf.kz' },
    update: {},
    create: {
      email: 'manager@greenleaf.kz',
      password: managerPassword,
      role: 'MANAGER',
      serviceCenterId: serviceCenter.id,
      isActive: true,
    },
  });

  console.log('✅ Менеджер создан:', manager.email);

  // Создаем тестовую заявку
  const application = await prisma.application.create({
    data: {
      applicationNumber: 'APP' + Date.now().toString().slice(-6),
      firstName: 'Иван',
      lastName: 'Иванов',
      phone: '87771234567',
      email: 'ivan@example.com',
      sponsor: 'kz12345678',
      placement: 'kz12345678',
      idNumber: '123456789012',
      placementArea: 'AUTO',
      paymentMethod: 'KASPI',
      status: 'NEW',
      serviceCenterId: serviceCenter.id,
    },
  });

  console.log('✅ Тестовая заявка создана:', application.applicationNumber);

  // Создаем историю заявки
  await prisma.applicationHistory.create({
    data: {
      applicationId: application.id,
      status: 'NEW',
      comment: 'Заявка создана',
      changedBy: 'system',
    },
  });

  console.log('✅ История заявки создана');

  // Создаем системные настройки
  const defaultSettings = [
    { key: 'DEFAULT_TEMP_PASSWORD', value: 'Aa12345', description: 'Временный пароль по умолчанию' },
    { key: 'PROCESSING_INTERVAL', value: '30000', description: 'Интервал обработки очереди (мс)' },
    { key: 'MAX_FILE_SIZE', value: '5242880', description: 'Максимальный размер файла (байт)' },
    { key: 'GREENLEAF_API_URL', value: 'https://greenleaf-global.com/api', description: 'URL API Greenleaf' },
    { key: 'GREENLEAF_API_KEY', value: '', description: 'API ключ Greenleaf' },
    { key: 'SESSION_TIMEOUT', value: '24', description: 'Таймаут сессии (часы)' },
    { key: 'MAX_LOGIN_ATTEMPTS', value: '5', description: 'Максимум попыток входа' },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ Системные настройки созданы');

  console.log('\n🎉 Инициализация завершена!');
  console.log('\nДоступы для входа:');
  console.log('Администратор: admin@greenleaf.kz / admin123');
  console.log('Менеджер: manager@greenleaf.kz / manager123');
  console.log('\nТестовая ссылка: http://localhost:3000/?sc=' + serviceCenter.id);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка инициализации:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

