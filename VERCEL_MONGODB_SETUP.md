# Vercel MongoDB Setup

## Переменные окружения для Vercel:

### Обязательные переменные:

1. **MONGODB_URI**
   - Значение: `mongodb+srv://sanmemik2000:tgDP9U6B5v95gzJ4@cluster0.aism76i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
   - Описание: Строка подключения к MongoDB Atlas

2. **MONGODB_DB**
   - Значение: `greenleaf`
   - Описание: Название базы данных

3. **JWT_SECRET**
   - Значение: `your-production-secret-key-change-this`
   - Описание: Секретный ключ для JWT токенов

4. **DEFAULT_ADMIN_PASSWORD**
   - Значение: `admin123`
   - Описание: Пароль по умолчанию для администратора

5. **NEXTAUTH_URL**
   - Значение: `https://your-domain.vercel.app`
   - Описание: URL вашего приложения на Vercel

6. **NEXTAUTH_SECRET**
   - Значение: `your-nextauth-secret-key`
   - Описание: Секретный ключ для NextAuth

### Как настроить в Vercel:

1. Перейдите в настройки проекта в Vercel
2. Выберите вкладку "Environment Variables"
3. Добавьте каждую переменную с соответствующим значением
4. Перезапустите деплой

### Инициализация базы данных:

После деплоя на Vercel, выполните инициализацию MongoDB:

```bash
npm run mongodb:init
```

Или через Vercel CLI:

```bash
vercel env pull
npm run mongodb:init
```

### Преимущества MongoDB Atlas:

- ✅ Облачная база данных
- ✅ Автоматическое масштабирование
- ✅ Резервное копирование
- ✅ Высокая доступность
- ✅ Безопасность на уровне предприятия

### Структура базы данных:

- **users** - Пользователи системы
- **service_centers** - Сервисные центры
- **applications** - Заявки на регистрацию
- **application_history** - История изменений заявок
- **audit_logs** - Логи аудита
- **system_settings** - Системные настройки

### Индексы:

- `users.email` - уникальный
- `service_centers.number` - уникальный
- `applications.applicationNumber` - уникальный
- `applications.serviceCenterId` - для поиска
- `applications.status` - для фильтрации
- `audit_logs.userId` - для поиска
- `audit_logs.createdAt` - для сортировки
- `system_settings.key` - уникальный
