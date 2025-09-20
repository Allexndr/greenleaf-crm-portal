# Развертывание Greenleaf Registration System

## 🚀 Быстрый старт

### Автоматический запуск
```bash
./start.sh
```

### Ручной запуск
```bash
# 1. Установка зависимостей
npm install

# 2. Настройка базы данных
npx prisma generate
npx prisma db push

# 3. Инициализация данных
npm run db:init

# 4. Запуск приложения
npm run dev
```

## 🔧 Конфигурация

### Переменные окружения (.env.local)
```env
# База данных
DATABASE_URL="file:./dev.db"

# JWT секрет (обязательно изменить в production)
JWT_SECRET="your-super-secret-jwt-key-here"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Greenleaf API
GREENLEAF_API_URL="https://greenleaf-global.com/api"
GREENLEAF_API_KEY="your-greenleaf-api-key"

# Файлы
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="5242880"

# Системные настройки
DEFAULT_TEMP_PASSWORD="Aa12345"
PROCESSING_INTERVAL="30000"
```

## 🏗️ Production развертывание

### 1. Подготовка сервера

#### Требования
- Node.js 18+
- PostgreSQL (рекомендуется) или SQLite
- Nginx (для reverse proxy)
- SSL сертификат

#### Установка зависимостей
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm postgresql nginx

# CentOS/RHEL
sudo yum install nodejs npm postgresql nginx
```

### 2. Настройка базы данных

#### PostgreSQL
```bash
# Создание базы данных
sudo -u postgres psql
CREATE DATABASE greenleaf_registration;
CREATE USER greenleaf_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE greenleaf_registration TO greenleaf_user;
\q
```

#### Обновление .env.local
```env
DATABASE_URL="postgresql://greenleaf_user:secure_password@localhost:5432/greenleaf_registration"
```

### 3. Сборка и запуск

```bash
# Установка зависимостей
npm ci --only=production

# Генерация Prisma клиента
npx prisma generate

# Применение миграций
npx prisma db push

# Инициализация данных
npm run db:init

# Сборка приложения
npm run build

# Запуск
npm start
```

### 4. Настройка Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Настройка systemd

```ini
# /etc/systemd/system/greenleaf-registration.service
[Unit]
Description=Greenleaf Registration System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/greenleaf-registration
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Активация сервиса
sudo systemctl enable greenleaf-registration
sudo systemctl start greenleaf-registration
sudo systemctl status greenleaf-registration
```

## 🐳 Docker развертывание

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Генерация Prisma клиента
RUN npx prisma generate

# Сборка приложения
RUN npm run build

# Создание пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Изменение владельца файлов
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://greenleaf_user:password@db:5432/greenleaf_registration
      - JWT_SECRET=your-jwt-secret
      - NEXTAUTH_URL=https://your-domain.com
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=greenleaf_registration
      - POSTGRES_USER=greenleaf_user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
```

### Запуск с Docker
```bash
# Сборка и запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

## 📊 Мониторинг

### Логи
```bash
# Просмотр логов приложения
journalctl -u greenleaf-registration -f

# Просмотр логов Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Мониторинг производительности
- Используйте PM2 для управления процессами Node.js
- Настройте мониторинг базы данных
- Настройте алерты для ошибок

### Резервное копирование
```bash
# Резервное копирование базы данных
pg_dump greenleaf_registration > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление
psql greenleaf_registration < backup_file.sql
```

## 🔒 Безопасность

### Рекомендации
1. **Измените все пароли по умолчанию**
2. **Используйте сильные JWT секреты**
3. **Настройте HTTPS**
4. **Ограничьте доступ к базе данных**
5. **Регулярно обновляйте зависимости**
6. **Настройте файрвол**
7. **Используйте fail2ban для защиты от брутфорса**

### Проверка безопасности
```bash
# Аудит зависимостей
npm audit

# Исправление уязвимостей
npm audit fix

# Проверка SSL
openssl s_client -connect your-domain.com:443
```

## 🚨 Устранение неполадок

### Частые проблемы

#### База данных не подключается
```bash
# Проверка подключения
npx prisma db push

# Сброс базы данных
npx prisma db push --force-reset
npm run db:init
```

#### Ошибки сборки
```bash
# Очистка кэша
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

#### Проблемы с правами
```bash
# Исправление прав на файлы
sudo chown -R www-data:www-data /path/to/app
sudo chmod -R 755 /path/to/app
```

### Логи отладки
```bash
# Включение подробных логов
DEBUG=* npm run dev

# Логи Prisma
DEBUG=prisma:* npm run dev
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи приложения
2. Убедитесь в правильности конфигурации
3. Проверьте доступность базы данных
4. Обратитесь к администратору системы

---

**Система готова к production использованию!** 🎉

