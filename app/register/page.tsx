'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { PaymentMethod, PlacementArea } from '@/lib/types';
import { validatePhoneNumber } from '@/lib/utils';

const registrationSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().min(1, 'Фамилия обязательна'),
  phone: z.string().min(1, 'Телефон обязателен').refine(validatePhoneNumber, 'Телефон должен начинаться с 8 и содержать 11 цифр'),
  email: z.string().email('Некорректный email'),
  sponsor: z.string().min(1, 'Спонсор обязателен'),
  placement: z.string().min(1, 'Номер размещения обязателен'),
  idNumber: z.string().min(1, 'Номер удостоверения обязателен'),
  placementArea: z.nativeEnum(PlacementArea, { required_error: 'Выберите область размещения' }),
  paymentMethod: z.nativeEnum(PaymentMethod, { required_error: 'Выберите способ оплаты' }),
  paymentReceipt: z.string().optional(),
  consent: z.boolean().refine(val => val === true, 'Необходимо согласие на обработку данных'),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

interface ServiceCenter {
  id: string;
  number: string;
  description: string;
  address: string;
}

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceCenterId = searchParams.get('sc');
  const [serviceCenter, setServiceCenter] = useState<ServiceCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      placementArea: PlacementArea.AUTO,
      consent: false,
    },
  });

  const paymentMethod = watch('paymentMethod');

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
      } else {
        toast.error('Сервисный центр не найден');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching service center:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RegistrationForm) => {
    if (!serviceCenterId) {
      toast.error('Не указан сервисный центр');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          serviceCenterId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Заявка успешно подана!');
        router.push(`/status?sc=${serviceCenterId}&app=${result.applicationNumber}`);
      } else {
        toast.error(result.error || 'Ошибка при подаче заявки');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Ошибка при подаче заявки');
    } finally {
      setSubmitting(false);
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

  if (!serviceCenter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Ошибка</h1>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Сервисный центр не найден.
            </p>
            <Button onClick={() => router.push('/')}>
              Вернуться на главную
            </Button>
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
                Регистрация нового пользователя
              </h1>
              <p className="text-gray-600 mt-1">
                Сервисный центр {serviceCenter.number} • {serviceCenter.address}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/?sc=${serviceCenterId}`)}
            >
              Назад
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold text-gray-900">
              Ваши данные
            </h2>
            <p className="text-gray-600">
              Заполните все обязательные поля для подачи заявки
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">Имя *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="Введите имя"
                    error={!!errors.firstName}
                  />
                  {errors.firstName && (
                    <p className="error-message">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Фамилия *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="Введите фамилию"
                    error={!!errors.lastName}
                  />
                  {errors.lastName && (
                    <p className="error-message">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone">Телефон *</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="8XXXXXXXXXX"
                    error={!!errors.phone}
                  />
                  {errors.phone && (
                    <p className="error-message">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="example@mail.ru"
                    error={!!errors.email}
                  />
                  {errors.email && (
                    <p className="error-message">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Greenleaf Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="sponsor">Спонсор *</Label>
                  <Input
                    id="sponsor"
                    {...register('sponsor')}
                    placeholder="Введите спонсора"
                    error={!!errors.sponsor}
                  />
                  {errors.sponsor && (
                    <p className="error-message">{errors.sponsor.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="placement">Номер размещения *</Label>
                  <Input
                    id="placement"
                    {...register('placement')}
                    placeholder="Введите номер размещения"
                    error={!!errors.placement}
                  />
                  {errors.placement && (
                    <p className="error-message">{errors.placement.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="idNumber">Номер удостоверения *</Label>
                <Input
                  id="idNumber"
                  {...register('idNumber')}
                  placeholder="Введите номер удостоверения"
                  error={!!errors.idNumber}
                />
                {errors.idNumber && (
                  <p className="error-message">{errors.idNumber.message}</p>
                )}
              </div>

              {/* Placement Area */}
              <div>
                <Label>Область размещения *</Label>
                <div className="mt-2 space-y-2">
                  {Object.values(PlacementArea).map((area) => (
                    <label key={area} className="flex items-center">
                      <input
                        type="radio"
                        value={area}
                        {...register('placementArea')}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {area === PlacementArea.AUTO && 'Авто'}
                        {area === PlacementArea.LEFT && 'Лево'}
                        {area === PlacementArea.RIGHT && 'Право'}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.placementArea && (
                  <p className="error-message">{errors.placementArea.message}</p>
                )}
              </div>

              {/* Payment Information */}
              <div>
                <Label>Способ оплаты *</Label>
                <div className="mt-2 space-y-2">
                  {Object.values(PaymentMethod).map((method) => (
                    <label key={method} className="flex items-center">
                      <input
                        type="radio"
                        value={method}
                        {...register('paymentMethod')}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {method === PaymentMethod.KASPI && 'Каспи'}
                        {method === PaymentMethod.CASH && 'Наличные'}
                        {method === PaymentMethod.OTHER_BANKS && 'Другие банки'}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.paymentMethod && (
                  <p className="error-message">{errors.paymentMethod.message}</p>
                )}
              </div>

              {paymentMethod === PaymentMethod.CASH && (
                <div>
                  <Label htmlFor="paymentReceipt">Чек об оплате</Label>
                  <Input
                    id="paymentReceipt"
                    {...register('paymentReceipt')}
                    placeholder="Описание чека или ссылка на фото"
                  />
                </div>
              )}

              {/* Consent */}
              <div>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('consent')}
                    className="mt-1 mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Я предоставляю согласие на обработку персональных данных, 
                    а также подтверждаю ознакомление и согласие с{' '}
                    <a href="#" className="text-primary-600 hover:underline">
                      Политикой конфиденциальности
                    </a>{' '}
                    и{' '}
                    <a href="#" className="text-primary-600 hover:underline">
                      Пользовательским соглашением
                    </a>
                    *
                  </span>
                </label>
                {errors.consent && (
                  <p className="error-message">{errors.consent.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/?sc=${serviceCenterId}`)}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Отправка...' : 'Подать заявку'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

