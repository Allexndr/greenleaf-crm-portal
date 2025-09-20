# Деплой на Vercel с MongoDB Atlas

## 🚀 Пошаговая инструкция

### 1. Настройка MongoDB Atlas

1. **Создайте пользователя базы данных:**
   - Войдите в MongoDB Atlas
   - Перейдите в "Database Access"
   - Создайте пользователя: `greenleaf_user` с паролем `Greenleaf2024!`
   - Дайте права "Read and write to any database"

2. **Настройте сетевой доступ:**
   - Перейдите в "Network Access"
   - Добавьте IP адрес `0.0.0.0/0` (доступ отовсюду)

3. **Получите строку подключения:**
   - Перейдите в "Database" → "Connect"
   - Выберите "Connect your application"
   - Скопируйте строку подключения

### 2. Настройка Vercel

1. **Добавьте переменные окружения в Vercel:**
   ```
   MONGODB_URI=mongodb+srv://greenleaf_user:Greenleaf2024!@cluster0.aism76i.mongodb.net/greenleaf?retryWrites=true&w=majority&appName=Cluster0
   MONGODB_DB=greenleaf
   JWT_SECRET=your-production-secret-key-change-this
   DEFAULT_ADMIN_PASSWORD=admin123
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-nextauth-secret-key
   ```

2. **Деплой проекта:**
   ```bash
   git add .
   git commit -m "Add MongoDB support"
   git push origin main
   ```

### 3. Инициализация базы данных

После успешного деплоя выполните инициализацию:

```bash
# Локально (для тестирования)
MONGODB_URI="your-connection-string" npm run mongodb:init

# Или через Vercel CLI
vercel env pull
npm run mongodb:init
```

### 4. Проверка работы

1. Откройте ваше приложение на Vercel
2. Перейдите в админ панель: `https://your-domain.vercel.app/admin/login`
3. Войдите с данными:
   - **Админ**: `admin@greenleaf.kz` / `admin123`
   - **Менеджер**: `manager@greenleaf.kz` / `manager123`

### 5. Структура базы данных

После инициализации в MongoDB Atlas будут созданы коллекции:

- **users** - Пользователи системы
- **service_centers** - Сервисные центры  
- **applications** - Заявки на регистрацию
- **application_history** - История изменений
- **audit_logs** - Логи аудита
- **system_settings** - Системные настройки

### 6. Преимущества MongoDB Atlas

- ✅ **Облачная база данных** - не нужно настраивать сервер
- ✅ **Автоматическое масштабирование** - подстраивается под нагрузку
- ✅ **Резервное копирование** - автоматические бэкапы
- ✅ **Высокая доступность** - 99.95% uptime
- ✅ **Безопасность** - шифрование данных
- ✅ **Мониторинг** - встроенная аналитика

### 7. Мониторинг

В MongoDB Atlas вы можете:
- Отслеживать производительность
- Просматривать логи
- Настраивать алерты
- Управлять пользователями

### 8. Резервное копирование

MongoDB Atlas автоматически создает:
- Ежедневные бэкапы
- Point-in-time восстановление
- Географически распределенные копии

### 9. Безопасность

- Шифрование данных в покое и в движении
- Аутентификация и авторизация
- Сетевая изоляция
- Аудит доступа

## 🎉 Готово!

Ваше приложение теперь работает с MongoDB Atlas на Vercel!
