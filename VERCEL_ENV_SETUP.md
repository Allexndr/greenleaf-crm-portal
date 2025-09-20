# Vercel Environment Variables Setup

Для успешного деплоя на Vercel необходимо настроить следующие переменные окружения:

## Обязательные переменные:

1. **DATABASE_URL**
   - Значение: `file:./dev.db`
   - Описание: Путь к файлу базы данных SQLite

2. **JWT_SECRET**
   - Значение: `your-production-secret-key-change-this`
   - Описание: Секретный ключ для JWT токенов

3. **DEFAULT_ADMIN_PASSWORD**
   - Значение: `admin123`
   - Описание: Пароль по умолчанию для администратора

4. **NEXTAUTH_URL**
   - Значение: `https://your-domain.vercel.app`
   - Описание: URL вашего приложения на Vercel

5. **NEXTAUTH_SECRET**
   - Значение: `your-nextauth-secret-key`
   - Описание: Секретный ключ для NextAuth

## Как настроить в Vercel:

1. Перейдите в настройки проекта в Vercel
2. Выберите вкладку "Environment Variables"
3. Добавьте каждую переменную с соответствующим значением
4. Перезапустите деплой

## Альтернативное решение:

Если проблемы с базой данных продолжаются, можно использовать внешнюю базу данных:

- **PostgreSQL**: Используйте Vercel Postgres
- **MySQL**: Используйте PlanetScale или другой провайдер
- **MongoDB**: Используйте MongoDB Atlas

Для этого измените `DATABASE_URL` на строку подключения к внешней базе данных.
