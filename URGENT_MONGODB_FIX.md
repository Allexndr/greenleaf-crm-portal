# 🚨 СРОЧНО: Исправление MongoDB

## Проблема:
Ошибка "bad auth : Authentication failed" означает, что пользователь `greenleaf_user` не существует в MongoDB Atlas.

## 🔧 БЫСТРОЕ РЕШЕНИЕ:

### 1. Создайте пользователя в MongoDB Atlas:

1. **Откройте https://cloud.mongodb.com**
2. **Войдите в ваш аккаунт**
3. **Перейдите в "Database Access"**
4. **Нажмите "Add New Database User"**
5. **Заполните:**
   - **Username**: `greenleaf_user`
   - **Password**: `Greenleaf2024!`
   - **Database User Privileges**: "Read and write to any database"
6. **Нажмите "Add User"**

### 2. Настройте сетевой доступ:

1. **Перейдите в "Network Access"**
2. **Нажмите "Add IP Address"**
3. **Выберите "Allow access from anywhere" (0.0.0.0/0)**
4. **Нажмите "Confirm"**

### 3. Обновите строку подключения:

Замените в файле `quick-test.js` строку:
```javascript
const uri = "mongodb+srv://greenleaf_user:Greenleaf2024!@cluster0.aism76i.mongodb.net/greenleaf?retryWrites=true&w=majority&appName=Cluster0";
```

### 4. Запустите тест:

```bash
node quick-test.js
```

## 🎯 Альтернативное решение (если не хотите создавать пользователя):

Используйте существующего пользователя `sanmemik2000`:

1. **Откройте `quick-test.js`**
2. **Замените строку подключения на:**
```javascript
const uri = "mongodb+srv://sanmemik2000:tgDP9U6B5v95gzJ4@cluster0.aism76i.mongodb.net/greenleaf?retryWrites=true&w=majority&appName=Cluster0";
```

3. **Запустите:**
```bash
node quick-test.js
```

## ✅ После успешного подключения:

1. **Запустите сервер:**
```bash
npm run dev
```

2. **Откройте админ панель:**
http://localhost:3000/admin/login

3. **Войдите с данными:**
- **Админ**: `admin@greenleaf.kz` / `admin123`
- **Менеджер**: `manager@greenleaf.kz` / `manager123`

## 🆘 Если ничего не работает:

Используйте SQLite для локальной разработки:

```bash
# Удалите MongoDB файлы
rm -f quick-test.js
rm -f scripts/init-users-mongodb.js

# Используйте SQLite
npm run db:init
npm run dev
```

## 📞 Нужна помощь?

Если у вас есть доступ к MongoDB Atlas, создайте пользователя `greenleaf_user` с паролем `Greenleaf2024!` и правами "Read and write to any database".
