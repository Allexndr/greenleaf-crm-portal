'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ApplicationStatus, getStatusLabel, PaymentMethod, getPaymentMethodLabel, UserRole } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
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
  placementArea: string;
  paymentMethod: PaymentMethod;
  status: ApplicationStatus;
  serviceCenter: {
    id: string;
    number: string;
    description: string;
  };
  manager?: {
    id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ServiceCenter {
  id: string;
  number: string;
  description: string;
}

export default function ApplicationsManagementPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    serviceCenterId: '',
    managerId: '',
    paymentMethod: '',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  useEffect(() => {
    fetchApplications();
    fetchServiceCenters();
    fetchManagers();
  }, [filters]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin/applications?${query}`);
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      const data = await response.json();
      setApplications(data);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке заявок');
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceCenters = async () => {
    try {
      const response = await fetch('/api/admin/service-centers');
      if (!response.ok) {
        throw new Error('Failed to fetch service centers');
      }
      const data = await response.json();
      setServiceCenters(data);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке сервисных центров');
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=' + UserRole.MANAGER);
      if (!response.ok) {
        throw new Error('Failed to fetch managers');
      }
      const data = await response.json();
      setManagers(data);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке менеджеров');
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleExport = async () => {
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin/applications/export?${query}`);
      if (!response.ok) {
        throw new Error('Failed to export applications');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applications_export_${formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Данные успешно экспортированы');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при экспорте данных');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Управление Заявками</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-500" /> Фильтры и Поиск
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Поиск (ID, ФИО, Телефон)</Label>
            <Input
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Поиск..."
            />
          </div>
          <div>
            <Label htmlFor="status">Статус</Label>
            <Select id="status" name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">Все</option>
              {Object.values(ApplicationStatus).map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="serviceCenterId">Сервисный центр</Label>
            <Select id="serviceCenterId" name="serviceCenterId" value={filters.serviceCenterId} onChange={handleFilterChange}>
              <option value="">Все</option>
              {serviceCenters.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.number} - {sc.description}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="managerId">Менеджер</Label>
            <Select id="managerId" name="managerId" value={filters.managerId} onChange={handleFilterChange}>
              <option value="">Все</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.email}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="paymentMethod">Способ оплаты</Label>
            <Select id="paymentMethod" name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange}>
              <option value="">Все</option>
              {Object.values(PaymentMethod).map((method) => (
                <option key={method} value={method}>
                  {getPaymentMethodLabel(method)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="startDate">Дата от</Label>
            <Input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
          </div>
          <div>
            <Label htmlFor="endDate">Дата до</Label>
            <Input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={() => setFilters({ status: '', serviceCenterId: '', managerId: '', paymentMethod: '', search: '', startDate: '', endDate: '' })} variant="secondary">
              Сбросить
            </Button>
            <Button onClick={fetchApplications}>
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" /> Применить
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Список Заявок</CardTitle>
          <Button onClick={handleExport} variant="outline">
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Экспорт в XLSX
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Загрузка заявок...</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Заявки не найдены.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Время подачи
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ФИО
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Телефон
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Способ оплаты
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сервисный центр
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Спонсор
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номер размещения
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Действия</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {app.applicationNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(new Date(app.createdAt), 'DD.MM.YYYY HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {app.firstName} {app.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getPaymentMethodLabel(app.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          app.status === ApplicationStatus.APPROVED ? 'bg-green-100 text-green-800' :
                          app.status === ApplicationStatus.REJECTED ? 'bg-red-100 text-red-800' :
                          app.status === ApplicationStatus.ERROR ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getStatusLabel(app.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.serviceCenter.number} - {app.serviceCenter.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.sponsor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.placement}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/admin/applications/${app.id}`} className="text-primary-600 hover:text-primary-900">
                          Просмотр
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

