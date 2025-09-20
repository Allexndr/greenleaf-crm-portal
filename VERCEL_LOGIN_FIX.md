# 🚨 СРОЧНО: Исправление входа на Vercel

## Проблема:
На Vercel сервере не работает вход, потому что пользователи не созданы в MongoDB.

## 🔧 БЫСТРОЕ РЕШЕНИЕ:

### 1. Инициализация пользователей через API:

Откройте в браузере или выполните curl:
```
POST https://your-domain.vercel.app/api/init-users
```

Или через curl:
```bash
curl -X POST https://your-domain.vercel.app/api/init-users
```

### 2. Проверка результата:

После выполнения вы должны увидеть:
```json
{
  "success": true,
  "message": "Пользователи успешно созданы",
  "users": {
    "admin": "admin@greenleaf.kz / admin123",
    "manager": "manager@greenleaf.kz / manager123"
  }
}
```

### 3. Вход в админ панель:

После инициализации откройте:
```
https://your-domain.vercel.app/admin/login
```

И войдите с данными:
- **Администратор**: `admin@greenleaf.kz` / `admin123`
- **Менеджер**: `manager@greenleaf.kz` / `manager123`

## 🔧 Альтернативное решение (если API не работает):

### 1. Локальная инициализация:

```bash
# Установите переменные окружения
export MONGODB_URI="your-mongodb-connection-string"
export MONGODB_DB="greenleaf"

# Запустите инициализацию
npm run vercel:init
```

### 2. Проверка подключения:

```bash
# Тест подключения к MongoDB
node test-mongodb.js
```

## 🆘 Если ничего не работает:

### 1. Проверьте переменные окружения в Vercel:
- `MONGODB_URI` - строка подключения к MongoDB
- `MONGODB_DB` - название базы данных (greenleaf)

### 2. Проверьте MongoDB Atlas:
- Пользователь `greenleaf_user` создан
- Пароль `Greenleaf2024!` установлен
- Сетевой доступ `0.0.0.0/0` настроен

### 3. Проверьте логи Vercel:
- Откройте Vercel Dashboard
- Перейдите в Functions
- Посмотрите логи для `/api/init-users`

## 📞 Нужна помощь?

Если проблема не решается:
1. Проверьте логи в Vercel Dashboard
2. Убедитесь что MongoDB Atlas настроен правильно
3. Проверьте переменные окружения

## ✅ После успешной инициализации:

Система будет полностью работоспособна:
- ✅ Вход в админ панель
- ✅ Управление заявками
- ✅ Управление пользователями
- ✅ Отчеты и экспорт
- ✅ Все функции системы
