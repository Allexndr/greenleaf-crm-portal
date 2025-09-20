'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  const searchParams = useSearchParams();
  const serviceCenterId = searchParams.get('sc');
  const [serviceCenter, setServiceCenter] = useState<ServiceCenter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serviceCenterId) {
      fetchServiceCenter(serviceCenterId);
    } else {
      setLoading(false);
    }
  }, [serviceCenterId]);

  const fetchServiceCenter = async (id: string) => {
    try {
      const response = await fetch(`/api/service-centers/${id}`);
      if (response.ok) {
        const data = await response.json();
        setServiceCenter(data);
      }
    } catch (error) {
      console.error('Error fetching service center:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!serviceCenterId) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Greenleaf Global
                </h1>
                <p className="text-gray-600 mt-1">Система регистрации пользователей</p>
              </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-2">Добро пожаловать!</p>
              <div className="space-x-2">
                <Link href="/admin/login">
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                    🔐 Админ панель
                  </Button>
                </Link>
                <Link href="?sc=68ce92ea47d698e84e885939">
                  <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50">
                    🏢 Тестовый центр
                  </Button>
                </Link>
              </div>
            </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Система регистрации Greenleaf
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Для доступа к системе регистрации необходимо получить ссылку от вашего сервисного центра.
            </p>
            
            {/* Admin Access Button */}
            <div className="mb-8">
              <Link href="/admin/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium">
                  🔐 Вход для администраторов
                </Button>
              </Link>
              <p className="text-sm text-gray-500 mt-2">
                Доступ для администраторов, менеджеров и сотрудников сервисных центров
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* New User Registration */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Новый пользователь
                </h3>
                <p className="text-gray-600">
                  Подать заявку на регистрацию в системе Greenleaf
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6">
                  Заполните форму для подачи заявки на регистрацию. 
                  После рассмотрения заявки вы получите логин и временный пароль.
                </p>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">
                    Получите ссылку от вашего сервисного центра
                  </p>
                  {/* Test button for development */}
                  <Link href="/register?sc=68ce92ea47d698e84e885939">
                    <Button variant="outline" className="w-full">
                      🧪 Тестовая регистрация
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Application Status */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Статус заявки
                </h3>
                <p className="text-gray-600">
                  Проверить статус поданной заявки
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6">
                  Введите номер заявки и телефон для проверки статуса. 
                  При утверждении вы увидите свои данные для входа.
                </p>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">
                    Получите ссылку от вашего сервисного центра
                  </p>
                  {/* Test button for development */}
                  <Link href="/status?sc=68ce92ea47d698e84e885939">
                    <Button variant="outline" className="w-full">
                      🔍 Тестовая проверка
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="mt-12">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Информация о регистрации
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Что нужно для регистрации:</h4>
                    <ul className="space-y-1">
                      <li>• Документ, удостоверяющий личность</li>
                      <li>• Контактные данные (телефон, email)</li>
                      <li>• Данные спонсора и размещения</li>
                      <li>• Чек об оплате стартового набора</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Процесс регистрации:</h4>
                    <ul className="space-y-1">
                      <li>• Подача заявки через форму</li>
                      <li>• Рассмотрение заявки менеджером</li>
                      <li>• Получение логина и пароля</li>
                      <li>• Доступ к личному кабинету</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-500 text-sm">
              <p>&copy; 2024 Greenleaf Global. Все права защищены.</p>
              <p className="mt-2">Система регистрации пользователей</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (!serviceCenter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Ошибка</h1>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Сервисный центр не найден или ссылка неверная.
            </p>
            <p className="text-sm text-gray-500">
              Обратитесь к администратору для получения правильной ссылки.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Сервисный центр {serviceCenter.number}
              </h1>
              <p className="text-gray-600 mt-1">{serviceCenter.address}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Greenleaf Global</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* New User Registration */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <h2 className="text-2xl font-semibold text-gray-900">
                Новый пользователь
              </h2>
              <p className="text-gray-600">
                Подать заявку на регистрацию в системе Greenleaf
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">
                Заполните форму ниже для подачи заявки на регистрацию. 
                После рассмотрения заявки вы получите логин и временный пароль.
              </p>
              <Link href={`/register?sc=${serviceCenterId}`}>
                <Button className="w-full btn-primary btn-lg">
                  Подать заявку
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Application Status */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <h2 className="text-2xl font-semibold text-gray-900">
                Статус заявки
              </h2>
              <p className="text-gray-600">
                Проверить статус поданной заявки
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">
                Введите номер заявки и телефон для проверки статуса. 
                При утверждении вы увидите свои данные для входа.
              </p>
              <Link href={`/status?sc=${serviceCenterId}`}>
                <Button className="w-full btn-secondary btn-lg">
                  Проверить статус
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <div className="mt-12">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Информация о регистрации
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Что нужно для регистрации:</h4>
                  <ul className="space-y-1">
                    <li>• Документ, удостоверяющий личность</li>
                    <li>• Контактные данные (телефон, email)</li>
                    <li>• Данные спонсора и размещения</li>
                    <li>• Чек об оплате стартового набора</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Процесс регистрации:</h4>
                  <ul className="space-y-1">
                    <li>• Подача заявки через форму</li>
                    <li>• Рассмотрение заявки менеджером</li>
                    <li>• Получение логина и пароля</li>
                    <li>• Доступ к личному кабинету</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2024 Greenleaf Global. Все права защищены.</p>
            <p className="mt-2">Система регистрации пользователей</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

