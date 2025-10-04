'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApplicationStatus, getStatusLabel, PaymentMethod, getPaymentMethodLabel, PlacementArea, getPlacementAreaLabel, getTrustColor } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { ArrowLeftIcon, CheckIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

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
  placementArea: PlacementArea;
  paymentMethod: PaymentMethod;
  paymentReceipt?: string;
  status: ApplicationStatus;
  rejectionReason?: string;
  greenleafLogin?: string;
  greenleafPassword?: string;
  serviceCenter: {
    id: string;
    number: string;
    description: string;
    address: string;
  };
  manager?: {
    id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  history: Array<{
    id: string;
    status: ApplicationStatus;
    comment?: string;
    changedBy: string;
    createdAt: string;
  }>;
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  useEffect(() => {
    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch application');
      }
      const data = await response.json();
      setApplication(data);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке заявки');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: ApplicationStatus, comment?: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          comment,
          rejectionReason: status === ApplicationStatus.REJECTED ? rejectionReason : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      toast.success('Статус заявки обновлен');
      await fetchApplication();
      setShowRejectionForm(false);
      setRejectionReason('');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении статуса');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Заявка не найдена</p>
        <Button onClick={() => router.back()} className="mt-4">
          Назад
        </Button>
      </div>
    );
  }

  const trustColor = getTrustColor(application.paymentMethod);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Заявка #{application.applicationNumber}
            </h1>
            <p className="text-gray-600">
              Подана: {formatDate(new Date(application.createdAt), 'DD.MM.YYYY HH:mm')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-badge ${
            application.status === ApplicationStatus.APPROVED ? 'status-approved' :
            application.status === ApplicationStatus.REJECTED ? 'status-rejected' :
            application.status === ApplicationStatus.ERROR ? 'status-error' :
            application.status === ApplicationStatus.UNDER_REVIEW ? 'status-under-review' :
            'status-new'
          }`}>
            {getStatusLabel(application.status)}
          </span>
          <span className={`status-badge trust-${trustColor.color}`}>
            {trustColor.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Данные клиента</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Имя</Label>
                  <Input value={application.firstName} readOnly />
                </div>
                <div>
                  <Label>Фамилия</Label>
                  <Input value={application.lastName} readOnly />
                </div>
                <div>
                  <Label>Телефон</Label>
                  <Input value={application.phone} readOnly />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={application.email} readOnly />
                </div>
                <div>
                  <Label>Номер удостоверения</Label>
                  <Input value={application.idNumber} readOnly />
                </div>
                <div>
                  <Label>Область размещения</Label>
                  <Input value={getPlacementAreaLabel(application.placementArea)} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Данные Greenleaf</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Спонсор</Label>
                  <Input value={application.sponsor} readOnly />
                </div>
                <div>
                  <Label>Номер размещения</Label>
                  <Input value={application.placement} readOnly />
                </div>
                <div>
                  <Label>Способ оплаты</Label>
                  <Input value={getPaymentMethodLabel(application.paymentMethod)} readOnly />
                </div>
                <div>
                  <Label>Сервисный центр</Label>
                  <Input value={`${application.serviceCenter.number} - ${application.serviceCenter.description}`} readOnly />
                </div>
              </div>
              {application.paymentReceipt && (
                <div>
                  <Label>Превью чека об оплате</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    {application.paymentReceipt.startsWith('data:') ? (
                      <img 
                        src={application.paymentReceipt} 
                        alt="Чек об оплате" 
                        className="max-w-full h-auto rounded border"
                        style={{ maxHeight: '300px' }}
                      />
                    ) : (
                      <p className="text-sm text-gray-700">{application.paymentReceipt}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Greenleaf Credentials (if approved) */}
          {application.status === ApplicationStatus.APPROVED && (application.greenleafLogin || application.greenleafPassword) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Данные для входа в Greenleaf</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Логин</Label>
                    <Input value={application.greenleafLogin || ''} readOnly />
                  </div>
                  <div>
                    <Label>Временный пароль</Label>
                    <Input value={application.greenleafPassword || ''} readOnly />
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Клиент должен сменить пароль при первом входе в систему
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason (if rejected) */}
          {application.status === ApplicationStatus.REJECTED && application.rejectionReason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Причина отклонения</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{application.rejectionReason}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions and History */}
        <div className="space-y-6">
          {/* Actions */}
          {application.status === ApplicationStatus.NEW && (
            <Card>
              <CardHeader>
                <CardTitle>Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleStatusChange(ApplicationStatus.UNDER_REVIEW, 'Заявка взята на рассмотрение')}
                  disabled={actionLoading}
                  className="w-full btn-primary"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Взять на рассмотрение
                </Button>
                <Button
                  onClick={() => handleStatusChange(ApplicationStatus.APPROVED, 'Заявка утверждена')}
                  disabled={actionLoading}
                  className="w-full btn-success"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Подтвердить
                </Button>
                <Button
                  onClick={() => setShowRejectionForm(true)}
                  disabled={actionLoading}
                  variant="danger"
                  className="w-full"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Отклонить
                </Button>
                <Button
                  onClick={() => {/* TODO: Implement request additional data */}}
                  disabled={actionLoading}
                  variant="secondary"
                  className="w-full"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Запросить доп. данные
                </Button>
              </CardContent>
            </Card>
          )}

          {application.status === ApplicationStatus.UNDER_REVIEW && (
            <Card>
              <CardHeader>
                <CardTitle>Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleStatusChange(ApplicationStatus.APPROVED, 'Заявка утверждена')}
                  disabled={actionLoading}
                  className="w-full btn-success"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Утвердить
                </Button>
                <Button
                  onClick={() => setShowRejectionForm(true)}
                  disabled={actionLoading}
                  variant="danger"
                  className="w-full"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Отклонить
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Rejection Form */}
          {showRejectionForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Отклонить заявку</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rejectionReason">Причина отклонения *</Label>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Укажите причину отклонения заявки"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleStatusChange(ApplicationStatus.REJECTED, 'Заявка отклонена')}
                    disabled={actionLoading || !rejectionReason.trim()}
                    variant="danger"
                    className="flex-1"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Отклонить
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectionForm(false);
                      setRejectionReason('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle>История изменений</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {application.history.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                    <div className="flex-shrink-0">
                      {entry.status === ApplicationStatus.APPROVED ? (
                        <CheckIcon className="h-5 w-5 text-green-600" />
                      ) : entry.status === ApplicationStatus.REJECTED ? (
                        <XMarkIcon className="h-5 w-5 text-red-600" />
                      ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {getStatusLabel(entry.status)}
                      </p>
                      {entry.comment && (
                        <p className="text-sm text-gray-600">{entry.comment}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {formatDate(new Date(entry.createdAt), 'DD.MM.YYYY HH:mm')} • {entry.changedBy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

