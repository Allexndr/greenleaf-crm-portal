# MongoDB Atlas Setup Instructions

## 1. Создание пользователя базы данных

1. Войдите в MongoDB Atlas
2. Перейдите в раздел "Database Access"
3. Нажмите "Add New Database User"
4. Выберите "Password" как метод аутентификации
5. Создайте пользователя:
   - **Username**: `greenleaf_user`
   - **Password**: `Greenleaf2024!` (или любой другой надежный пароль)
   - **Database User Privileges**: "Read and write to any database"
6. Нажмите "Add User"

## 2. Настройка сетевого доступа

1. Перейдите в раздел "Network Access"
2. Нажмите "Add IP Address"
3. Выберите "Allow access from anywhere" (0.0.0.0/0)
4. Нажмите "Confirm"

## 3. Получение строки подключения

1. Перейдите в раздел "Database"
2. Нажмите "Connect" на вашем кластере
3. Выберите "Connect your application"
4. Выберите "Node.js" и версию "4.1 or later"
5. Скопируйте строку подключения

## 4. Обновление строки подключения

Замените в строке подключения:
- `<username>` на `greenleaf_user`
- `<password>` на ваш пароль
- `<dbname>` на `greenleaf`

Пример:
```
mongodb+srv://greenleaf_user:Greenleaf2024!@cluster0.aism76i.mongodb.net/greenleaf?retryWrites=true&w=majority&appName=Cluster0
```

## 5. Настройка переменных окружения в Vercel

Добавьте в Vercel:
- **MONGODB_URI**: ваша строка подключения
- **MONGODB_DB**: `greenleaf`

## 6. Инициализация базы данных

После настройки выполните:
```bash
npm run mongodb:init
```

## 7. Проверка подключения

Создайте тестовый файл `test-mongodb.js`:

```javascript
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://greenleaf_user:Greenleaf2024!@cluster0.aism76i.mongodb.net/greenleaf?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('greenleaf');
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.close();
  }
}

testConnection();
```

Запустите:
```bash
node test-mongodb.js
```

## 8. Безопасность

- Используйте надежные пароли
- Ограничьте доступ по IP если возможно
- Регулярно обновляйте пароли
- Используйте переменные окружения для хранения строки подключения
