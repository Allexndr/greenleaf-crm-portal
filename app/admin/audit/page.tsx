'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    email: string;
    role: string;
  };
  serviceCenter?: {
    number: string;
    description: string;
  };
}

interface AuditStats {
  totalLogs: number;
  actionCounts: Array<{
    action: string;
    _count: {
      action: number;
    };
  }>;
  recentLogs: AuditLog[];
}

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    serviceCenterId: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  useEffect(() => {
    fetchAuditLogs();
    fetchAuditStats();
  }, [filters]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin/audit?${query}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      const data = await response.json();
      setAuditLogs(data);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке логов аудита');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditStats = async () => {
    try {
      const response = await fetch('/api/admin/audit/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch audit stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching audit stats:', error);
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
      a.download = `audit_logs_${formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Данные успешно экспортированы');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при экспорте данных');
    }
  };

  const getActionLabel = (action: string): string => {
    const actionLabels: { [key: string]: string } = {
      'LOGIN': 'Вход в систему',
      'LOGOUT': 'Выход из системы',
      'SERVICE_CENTER_CREATED': 'Создание сервисного центра',
      'SERVICE_CENTER_UPDATED': 'Обновление сервисного центра',
      'SERVICE_CENTER_DELETED': 'Удаление сервисного центра',
      'USER_CREATED': 'Создание пользователя',
      'USER_UPDATED': 'Обновление пользователя',
      'USER_DELETED': 'Удаление пользователя',
      'APPLICATION_STATUS_CHANGED': 'Изменение статуса заявки',
      'DATA_EXPORT': 'Экспорт данных',
      'PASSWORD_CHANGED': 'Изменение пароля',
      'ERROR': 'Ошибка',
    };
    return actionLabels[action] || action;
  };

  const getActionColor = (action: string): string => {
    if (action.includes('ERROR')) return 'text-red-600';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'text-blue-600';
    if (action.includes('CREATED')) return 'text-green-600';
    if (action.includes('UPDATED')) return 'text-yellow-600';
    if (action.includes('DELETED')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Аудит системы</h1>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-gray-600">Всего записей</h3>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalLogs.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-gray-600">Топ действий</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {stats.actionCounts.slice(0, 3).map((item) => (
                  <div key={item.action} className="flex justify-between text-sm">
                    <span className="text-gray-600">{getActionLabel(item.action)}</span>
                    <span className="font-medium">{item._count.action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-gray-600">Последние 24ч</h3>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.recentLogs.filter(log => {
                  const logDate = new Date(log.createdAt);
                  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                  return logDate > yesterday;
                }).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-gray-600">Ошибки</h3>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.actionCounts.find(item => item.action === 'ERROR')?._count.action || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-500" /> Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="action">Действие</Label>
            <Select id="action" name="action" value={filters.action} onChange={handleFilterChange}>
              <option value="">Все</option>
              <option value="LOGIN">Вход в систему</option>
              <option value="LOGOUT">Выход из системы</option>
              <option value="SERVICE_CENTER_CREATED">Создание сервисного центра</option>
              <option value="SERVICE_CENTER_UPDATED">Обновление сервисного центра</option>
              <option value="USER_CREATED">Создание пользователя</option>
              <option value="USER_UPDATED">Обновление пользователя</option>
              <option value="APPLICATION_STATUS_CHANGED">Изменение статуса заявки</option>
              <option value="DATA_EXPORT">Экспорт данных</option>
              <option value="ERROR">Ошибки</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="search">Поиск</Label>
            <Input
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Поиск по деталям..."
            />
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
            <Button onClick={() => setFilters({ action: '', userId: '', serviceCenterId: '', startDate: '', endDate: '', search: '' })} variant="secondary">
              Сбросить
            </Button>
            <Button onClick={fetchAuditLogs}>
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" /> Применить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Журнал аудита</CardTitle>
          <Button onClick={handleExport} variant="outline">
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Экспорт
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Загрузка логов...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Записи не найдены.</div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-medium ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(new Date(log.createdAt), 'DD.MM.YYYY HH:mm:ss')}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Пользователь:</span> {log.user.email} ({log.user.role})
                        {log.serviceCenter && (
                          <span className="ml-4">
                            <span className="font-medium">Центр:</span> {log.serviceCenter.number} - {log.serviceCenter.description}
                          </span>
                        )}
                      </div>

                      {log.details && (
                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          <pre className="whitespace-pre-wrap">{log.details}</pre>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {log.ipAddress && (
                          <span>IP: {log.ipAddress}</span>
                        )}
                        {log.userAgent && (
                          <span className="truncate max-w-xs">UA: {log.userAgent}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

