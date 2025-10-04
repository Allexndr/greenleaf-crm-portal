'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
// import Link from 'next/link'; // Temporarily disabled due to RSC issues
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Removed prisma import - not needed on client side

interface ServiceCenter {
  id: string;
  number: string;
  description: string;
  address: string;
}

export default function HomePage() {
  // For now, show the main page without service center ID
  const serviceCenterId = null;
  const serviceCenter = null;
  const loading = false;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <header className="glass-card border-0 shadow-xl">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex justify-between items-center py-8">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text">
                  Greenleaf Global
                </h1>
                <p className="text-gray-600 mt-2 font-medium text-sm sm:text-base">Система регистрации пользователей</p>
              </div>
              
              {/* Desktop Admin Button */}
              <div className="hidden md:block text-right">
                <p className="text-sm text-gray-500 mb-3 font-medium">Добро пожаловать!</p>
                <div className="space-x-3">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="hover-lift"
                    onClick={() => window.location.href = '/admin-auth/login'}
                  >
                    🔐 Админ панель
                  </Button>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMobileMenuOpen(true)}
                  className="hover-lift"
                >
                  ☰ Меню
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 right-0 flex w-64 flex-col bg-white">
              <div className="flex h-16 items-center justify-between px-4">
                <h2 className="text-lg font-bold text-gray-900">Меню</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Закрыть меню</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 px-4 py-4">
                <Button 
                  className="w-full btn-primary mb-4"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.location.href = '/admin-auth/login';
                  }}
                >
                  🔐 Админ панель
                </Button>
                <Button 
                  className="w-full btn-secondary mb-4"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.location.href = '/register?sc=68ce92ea47d698e84e885939';
                  }}
                >
                  📝 Подать заявку
                </Button>
                <Button 
                  className="w-full btn-secondary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.location.href = '/status?sc=68ce92ea47d698e84e885939';
                  }}
                >
                  🔍 Проверить статус
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-16">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-4 sm:mb-6">
              Система регистрации Greenleaf
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto mb-6 sm:mb-10 font-medium px-4">
              Для доступа к системе регистрации необходимо получить ссылку от вашего сервисного центра.
            </p>
            
            {/* Admin Access Button */}
            <div className="mb-8 sm:mb-12">
              <Button 
                className="btn-primary btn-lg hover-lift w-full sm:w-auto"
                onClick={() => window.location.href = '/admin-auth/login'}
              >
                🔐 Вход для администраторов
              </Button>
              <p className="text-sm text-gray-500 mt-3 font-medium px-4">
                Доступ для администраторов, менеджеров и сотрудников сервисных центров
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
            {/* New User Registration */}
            <Card className="hover-lift">
              <CardHeader>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  Новый пользователь
                </h3>
                <p className="text-gray-600 font-medium text-sm sm:text-base">
                  Подать заявку на регистрацию в системе Greenleaf
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                  Заполните форму для подачи заявки на регистрацию. 
                  После рассмотрения заявки вы получите логин и временный пароль.
                </p>
                <div className="text-center">
                  <Button 
                    className="btn-primary btn-lg hover-lift mb-4 sm:mb-6 w-full sm:w-auto"
                    onClick={() => window.location.href = '/register?sc=68ce92ea47d698e84e885939'}
                  >
                    📝 Подать заявку
                  </Button>
                  <p className="text-sm text-gray-500 font-medium">
                    Или получите ссылку от вашего сервисного центра
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Application Status */}
            <Card className="hover-lift">
              <CardHeader>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  Статус заявки
                </h3>
                <p className="text-gray-600 font-medium text-sm sm:text-base">
                  Проверить статус поданной заявки
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                  Введите номер заявки и телефон для проверки статуса. 
                  При утверждении вы увидите свои данные для входа.
                </p>
                <div className="text-center">
                  <Button 
                    className="btn-secondary btn-lg hover-lift mb-4 sm:mb-6 w-full sm:w-auto"
                    onClick={() => window.location.href = '/status?sc=68ce92ea47d698e84e885939'}
                  >
                    🔍 Проверить статус
                  </Button>
                  <p className="text-sm text-gray-500 font-medium">
                    Или получите ссылку от вашего сервисного центра
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="mt-20">
            <Card className="hover-lift">
              <CardContent className="pt-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                  Информация о регистрации
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-base text-gray-600">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 text-lg">Что нужно для регистрации:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Документ, удостоверяющий личность
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Контактные данные (телефон, email)
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Данные спонсора и размещения
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Чек об оплате стартового набора
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 text-lg">Процесс регистрации:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        Подача заявки через форму
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        Рассмотрение заявки менеджером
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        Получение логина и пароля
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        Доступ к личному кабинету
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="glass-card border-0 mt-12 sm:mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
            <div className="text-center text-gray-600">
              <p className="font-medium text-sm sm:text-base">&copy; 2024 Greenleaf Global. Все права защищены.</p>
              <p className="mt-2 font-medium text-sm sm:text-base">Система регистрации пользователей</p>
            </div>
          </div>
        </footer>
      </div>
    );
}


