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
import { ApplicationStatus, getStatusLabel, getTrustColor, getPaymentMethodLabel, getPlacementAreaLabel } from '@/lib/types';
import { validatePhoneNumber } from '@/lib/utils';

const statusCheckSchema = z.object({
  applicationNumber: z.string().min(1, 'Номер заявки обязателен'),
  phone: z.string().min(1, 'Телефон обязателен').refine(validatePhoneNumber, 'Телефон должен начинаться с 8 и содержать 11 цифр'),
});

type StatusCheckForm = z.infer<typeof statusCheckSchema>;

interface Application {
  id: string;
  applicationNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  sponsor: string;
  placement: string;
  idNumber: string;
  placementArea: string;
  paymentMethod: string;
  status: ApplicationStatus;
  rejectionReason?: string;
  greenleafLogin?: string;
  greenleafPassword?: string;
  createdAt: string;
  serviceCenter: {
    number: string;
    address: string;
  };
}

export default function StatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceCenterId = searchParams.get('sc');
  const applicationNumber = searchParams.get('app');
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<StatusCheckForm>({
    resolver: zodResolver(statusCheckSchema),
  });

  useEffect(() => {
    if (applicationNumber && serviceCenterId) {
      setValue('applicationNumber', applicationNumber);
      // Show message that phone number is required
      toast('Введите номер телефона для проверки статуса заявки', { icon: 'ℹ️' });
    }
  }, [applicationNumber, serviceCenterId, setValue]);

  const checkStatus = async (data: StatusCheckForm) => {
    setLoading(true);
    setSearched(true);
    try {
      const response = await fetch('/api/applications/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setApplication(result);
      } else {
        toast.error(result.error || 'Заявка не найдена');
        setApplication(null);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error('Ошибка при проверке статуса');
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: StatusCheckForm) => {
    checkStatus(data);
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.NEW:
        return 'status-new';
      case ApplicationStatus.UNDER_REVIEW:
        return 'status-under-review';
      case ApplicationStatus.APPROVED:
        return 'status-approved';
      case ApplicationStatus.REJECTED:
        return 'status-rejected';
      case ApplicationStatus.ERROR:
        return 'status-error';
      default:
        return 'status-new';
    }
  };

  const trustColor = application ? getTrustColor(application.paymentMethod as any) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Статус заявки
              </h1>
              <p className="text-gray-600 mt-1">
                Проверьте статус вашей заявки на регистрацию
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
              Проверка статуса
            </h2>
            <p className="text-gray-600">
              Введите номер заявки и телефон для проверки статуса
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="applicationNumber">Номер заявки *</Label>
                  <Input
                    id="applicationNumber"
                    {...register('applicationNumber')}
                    placeholder="Введите номер заявки"
                    error={!!errors.applicationNumber}
                  />
                  {errors.applicationNumber && (
                    <p className="error-message">{errors.applicationNumber.message}</p>
                  )}
                </div>

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
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Проверка...' : 'Проверить статус'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Application Status Display */}
        {searched && (
          <div className="mt-8">
            {application ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Заявка #{application.applicationNumber}
                      </h3>
                      <p className="text-gray-600">
                        Подана: {new Date(application.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`status-badge ${getStatusColor(application.status)}`}>
                        {getStatusLabel(application.status)}
                      </span>
                      {trustColor && (
                        <div className={`mt-2 status-badge trust-${trustColor.color}`}>
                          {trustColor.label}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Application Details */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Данные заявки
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">ФИО:</span>
                          <span className="ml-2 text-gray-900">
                            {application.lastName} {application.firstName}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Телефон:</span>
                          <span className="ml-2 text-gray-900">{application.phone}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Email:</span>
                          <span className="ml-2 text-gray-900">{application.email}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Спонсор:</span>
                          <span className="ml-2 text-gray-900">{application.sponsor}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Размещение:</span>
                          <span className="ml-2 text-gray-900">{application.placement}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Область:</span>
                          <span className="ml-2 text-gray-900">
                            {getPlacementAreaLabel(application.placementArea as any)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Оплата:</span>
                          <span className="ml-2 text-gray-900">
                            {getPaymentMethodLabel(application.paymentMethod as any)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Сервисный центр:</span>
                          <span className="ml-2 text-gray-900">
                            {application.serviceCenter.number} • {application.serviceCenter.address}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status-specific content */}
                    {application.status === ApplicationStatus.APPROVED && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-green-900 mb-4">
                          🎉 Заявка утверждена!
                        </h4>
                        <p className="text-green-700 mb-4">
                          Поздравляем! Ваша заявка была одобрена. Ниже указаны ваши данные для входа в систему:
                        </p>
                        <div className="bg-white border border-green-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium text-gray-700">Логин:</span>
                              <span className="ml-2 text-lg font-mono text-gray-900">
                                {application.greenleafLogin}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Временный пароль:</span>
                              <span className="ml-2 text-lg font-mono text-gray-900">
                                {application.greenleafPassword}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-sm text-yellow-800">
                              ⚠️ Обязательно смените пароль при первом входе в систему!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {application.status === ApplicationStatus.REJECTED && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-red-900 mb-4">
                          ❌ Заявка отклонена
                        </h4>
                        <p className="text-red-700 mb-4">
                          К сожалению, ваша заявка была отклонена.
                        </p>
                        {application.rejectionReason && (
                          <div className="bg-white border border-red-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-700 mb-2">Причина отклонения:</h5>
                            <p className="text-gray-900">{application.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {application.status === ApplicationStatus.UNDER_REVIEW && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-yellow-900 mb-4">
                          ⏳ Заявка на рассмотрении
                        </h4>
                        <p className="text-yellow-700">
                          Ваша заявка находится на рассмотрении. Мы уведомим вас о результате.
                        </p>
                      </div>
                    )}

                    {application.status === ApplicationStatus.ERROR && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-red-900 mb-4">
                          ⚠️ Ошибка обработки
                        </h4>
                        <p className="text-red-700">
                          Произошла ошибка при обработке вашей заявки. Обратитесь к администратору.
                        </p>
                      </div>
                    )}

                    {application.status === ApplicationStatus.NEW && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">
                          📝 Заявка создана
                        </h4>
                        <p className="text-gray-700">
                          Ваша заявка успешно создана и ожидает рассмотрения.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Заявка не найдена
                    </h3>
                    <p className="text-gray-600">
                      Проверьте правильность номера заявки и телефона
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

