'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import toast from 'react-hot-toast';

export default function TestGreenleafPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: 'Александр',
    lastName: 'Мурдасов',
    phone: '87002579004',
    email: 'sanmemik2000@gmail.com',
    sponsor: 'kz13476652',
    placement: 'kz13476652',
    idNumber: '123456789',
    placementArea: 'AUTO',
    serviceCenterLogin: 's240350',
    serviceCenterPassword: '1982a',
  });

  const handleFillForm = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/greenleaf/test-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        toast.success('Подключение к Greenleaf успешно!');
      } else {
        toast.error(data.error || 'Ошибка подключения');
        setResult({ error: data.error });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при подключении к Greenleaf');
      setResult({ error: 'Ошибка при подключении к Greenleaf' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Тестирование интеграции с Greenleaf Global
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Форма */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Данные для заполнения</h2>
              <p className="text-gray-600">
                Заполните данные, которые будут автоматически перенесены на сайт Greenleaf
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Имя *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Фамилия *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Телефон *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sponsor">Спонсор *</Label>
                  <Input
                    id="sponsor"
                    value={formData.sponsor}
                    onChange={(e) => setFormData({ ...formData, sponsor: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="placement">Номер размещения *</Label>
                  <Input
                    id="placement"
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="idNumber">Номер удостоверения *</Label>
                <Input
                  id="idNumber"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceCenterLogin">Логин сервисного центра</Label>
                  <Input
                    id="serviceCenterLogin"
                    value={formData.serviceCenterLogin}
                    onChange={(e) => setFormData({ ...formData, serviceCenterLogin: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="serviceCenterPassword">Пароль сервисного центра</Label>
                  <Input
                    id="serviceCenterPassword"
                    type="password"
                    value={formData.serviceCenterPassword}
                    onChange={(e) => setFormData({ ...formData, serviceCenterPassword: e.target.value })}
                  />
                </div>
              </div>

              <Button
                onClick={handleFillForm}
                disabled={loading}
                className="w-full btn-primary btn-lg"
              >
                {loading ? 'Заполняем форму...' : '🤖 Заполнить форму на Greenleaf'}
              </Button>
            </CardContent>
          </Card>

          {/* Результат */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Результат</h2>
              <p className="text-gray-600">
                Здесь будет показан результат автоматического заполнения
              </p>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">
                    Заполняем форму на сайте Greenleaf Global...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Это может занять несколько минут
                  </p>
                </div>
              )}

              {result && !loading && (
                <div className="space-y-4">
                  {result.success ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">
                        ✅ Форма успешно заполнена!
                      </h3>
                      {result.login && (
                        <p className="text-green-700">
                          <strong>Сгенерированный логин:</strong> {result.login}
                        </p>
                      )}
                      <p className="text-green-700">
                        <strong>Статус:</strong> {result.message}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="font-semibold text-red-800 mb-2">
                        ❌ Ошибка заполнения формы
                      </h3>
                      <p className="text-red-700">{result.error}</p>
                    </div>
                  )}

                  {result.screenshot && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Скриншот:</h4>
                      <img
                        src={result.screenshot}
                        alt="Screenshot of filled form"
                        className="w-full border rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}

              {!result && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <p>Нажмите кнопку "Заполнить форму" для начала тестирования</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Информация о тестировании</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Этот инструмент автоматически заполняет форму регистрации на сайте <a href="https://greenleaf-global.com/" target="_blank" className="text-blue-600 hover:underline">Greenleaf Global</a></p>
                <p>• Используются учетные данные сервисного центра: s240350 / 1982a</p>
                <p>• После заполнения формы автоматически нажимается кнопка "Далее"</p>
                <p>• Процесс может занять 2-5 минут в зависимости от скорости интернета</p>
                <p>• Браузер будет виден во время выполнения (для отладки)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
