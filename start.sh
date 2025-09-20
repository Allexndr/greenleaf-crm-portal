#!/bin/bash

# Greenleaf Registration System - Start Script
echo "🚀 Запуск системы регистрации Greenleaf..."

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js 18+ и попробуйте снова."
    exit 1
fi

# Проверка версии Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js версии 18 или выше. Текущая версия: $(node -v)"
    exit 1
fi

echo "✅ Node.js версия: $(node -v)"

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при установке зависимостей"
    exit 1
fi

echo "✅ Зависимости установлены"

# Настройка базы данных
echo "🗄️ Настройка базы данных..."

# Генерация Prisma клиента
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при генерации Prisma клиента"
    exit 1
fi

# Создание базы данных
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при создании базы данных"
    exit 1
fi

echo "✅ База данных настроена"

# Инициализация тестовых данных
echo "🔧 Инициализация тестовых данных..."
npm run db:init

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при инициализации данных"
    exit 1
fi

echo "✅ Тестовые данные созданы"

# Создание .env.local если не существует
if [ ! -f .env.local ]; then
    echo "📝 Создание файла конфигурации..."
    cp env.example .env.local
    echo "✅ Файл .env.local создан. Отредактируйте его при необходимости."
fi

echo ""
echo "🎉 Система готова к запуску!"
echo ""
echo "📋 Доступы для входа:"
echo "   Администратор: admin@greenleaf.kz / admin123"
echo "   Менеджер: manager@greenleaf.kz / manager123"
echo ""
echo "🌐 URL адреса:"
echo "   Главная страница: http://localhost:3000"
echo "   Админ-панель: http://localhost:3000/admin/login"
echo "   Тестовая ссылка: http://localhost:3000/?sc=<service-center-id>"
echo ""
echo "🚀 Запуск сервера разработки..."
echo "   Для остановки нажмите Ctrl+C"
echo ""

# Запуск сервера разработки
npm run dev

