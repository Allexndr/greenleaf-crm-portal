# Быстрая настройка MongoDB Atlas

## 🚀 ШАГ 1: Создание пользователя в MongoDB Atlas

1. **Войдите в MongoDB Atlas** (https://cloud.mongodb.com)
2. **Перейдите в "Database Access"**
3. **Нажмите "Add New Database User"**
4. **Настройте пользователя:**
   - **Username**: `greenleaf_user`
   - **Password**: `Greenleaf2024!` (или любой другой надежный пароль)
   - **Database User Privileges**: "Read and write to any database"
5. **Нажмите "Add User"**

## 🌐 ШАГ 2: Настройка сетевого доступа

1. **Перейдите в "Network Access"**
2. **Нажмите "Add IP Address"**
3. **Выберите "Allow access from anywhere" (0.0.0.0/0)**
4. **Нажмите "Confirm"**

## 🔗 ШАГ 3: Получение строки подключения

1. **Перейдите в "Database"**
2. **Нажмите "Connect" на вашем кластере**
3. **Выберите "Connect your application"**
4. **Выберите "Node.js" и версию "4.1 or later"**
5. **Скопируйте строку подключения**

## 📝 ШАГ 4: Обновление строки подключения

Замените в строке подключения:
- `<username>` на `greenleaf_user`
- `<password>` на ваш пароль
- `<dbname>` на `greenleaf`

**Пример:**
```
mongodb+srv://greenleaf_user:Greenleaf2024!@cluster0.aism76i.mongodb.net/greenleaf?retryWrites=true&w=majority&appName=Cluster0
```

## 🧪 ШАГ 5: Тестирование подключения

```bash
# Установите переменную окружения
export MONGODB_URI="mongodb+srv://greenleaf_user:Greenleaf2024!@cluster0.aism76i.mongodb.net/greenleaf?retryWrites=true&w=majority&appName=Cluster0"

# Протестируйте подключение
node test-mongodb.js
```

## 👥 ШАГ 6: Инициализация пользователей

```bash
# Инициализируйте пользователей
npm run mongodb:users
```

## ✅ ШАГ 7: Проверка работы

1. Откройте http://localhost:3000/admin/login
2. Войдите с данными:
   - **Админ**: `admin@greenleaf.kz` / `admin123`
   - **Менеджер**: `manager@greenleaf.kz` / `manager123`

## 🔧 Если не работает:

1. **Проверьте строку подключения** - убедитесь что пароль правильный
2. **Проверьте сетевой доступ** - должен быть 0.0.0.0/0
3. **Проверьте пользователя** - должен иметь права на чтение/запись
4. **Проверьте логи** - смотрите ошибки в консоли

## 📞 Поддержка:

Если что-то не работает, проверьте:
- Правильность строки подключения
- Настройки сетевого доступа
- Права пользователя базы данных
- Логи в консоли браузера и терминала
