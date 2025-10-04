'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface AuditLog {
  _id: string;
  userId: string;
  userEmail: string;
  serviceCenterId?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const auditActions = [
  'LOGIN',
  'LOGOUT',
  'CREATE_SERVICE_CENTER',
  'UPDATE_SERVICE_CENTER',
  'DELETE_SERVICE_CENTER',
  'CREATE_USER',
  'UPDATE_USER',
  'DELETE_USER',
  'RESET_PASSWORD',
  'APPROVE_APPLICATION',
  'REJECT_APPLICATION',
  'UPDATE_APPLICATION_STATUS',
  'EXPORT_DATA',
  'UPDATE_GREENLEAF_CREDENTIALS',
];

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    serviceCenterId: '',
    action: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin/audit?${query}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке журнала аудита');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleExport = async () => {
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin/audit/export?${query}`);
      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Журнал аудита успешно экспортирован');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при экспорте журнала аудита');
    }
  };

  const getActionLabel = (action: string): string => {
    const labels: { [key: string]: string } = {
      LOGIN: 'Вход в систему',
      LOGOUT: 'Выход из системы',
      CREATE_SERVICE_CENTER: 'Создание сервисного центра',
      UPDATE_SERVICE_CENTER: 'Обновление сервисного центра',
      DELETE_SERVICE_CENTER: 'Удаление сервисного центра',
      CREATE_USER: 'Создание пользователя',
      UPDATE_USER: 'Обновление пользователя',
      DELETE_USER: 'Удаление пользователя',
      RESET_PASSWORD: 'Сброс пароля',
      APPROVE_APPLICATION: 'Утверждение заявки',
      REJECT_APPLICATION: 'Отклонение заявки',
      UPDATE_APPLICATION_STATUS: 'Изменение статуса заявки',
      EXPORT_DATA: 'Экспорт данных',
      UPDATE_GREENLEAF_CREDENTIALS: 'Обновление учетных данных Greenleaf',
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Журнал аудита</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-500" /> Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="userId">Пользователь ID</Label>
            <Input
              id="userId"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              placeholder="ID пользователя"
            />
          </div>
          <div>
            <Label htmlFor="serviceCenterId">Сервисный центр ID</Label>
            <Input
              id="serviceCenterId"
              name="serviceCenterId"
              value={filters.serviceCenterId}
              onChange={handleFilterChange}
              placeholder="ID сервисного центра"
            />
          </div>
          <div>
            <Label htmlFor="action">Действие</Label>
            <Select id="action" name="action" value={filters.action} onChange={handleFilterChange}>
              <option value="">Все</option>
              {auditActions.map((action) => (
                <option key={action} value={action}>
                  {getActionLabel(action)}
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
            <Button onClick={() => setFilters({ userId: '', serviceCenterId: '', action: '', startDate: '', endDate: '' })} variant="secondary">
              Сбросить
            </Button>
            <Button onClick={fetchLogs}>
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" /> Применить
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Журнал действий</CardTitle>
          <Button onClick={handleExport} variant="outline">
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Экспорт в XLSX
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Загрузка журнала...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Записи не найдены.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата/Время
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действие
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Детали
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сервисный центр
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP адрес
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.userEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {log.details || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.serviceCenterId || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress || '-'}
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