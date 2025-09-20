'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { ApplicationStatus, getStatusLabel, PaymentMethod, getPaymentMethodLabel } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { ChartBarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ReportData {
  totalApplications: number;
  applicationsByStatus: Array<{
    status: ApplicationStatus;
    count: number;
  }>;
  applicationsByPaymentMethod: Array<{
    paymentMethod: PaymentMethod;
    count: number;
  }>;
  applicationsByServiceCenter: Array<{
    serviceCenter: {
      number: string;
      description: string;
    };
    count: number;
  }>;
  applicationsByMonth: Array<{
    month: string;
    count: number;
  }>;
  averageProcessingTime: number;
  topManagers: Array<{
    manager: {
      email: string;
    };
    count: number;
  }>;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    serviceCenterId: '',
  });

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin/reports?${query}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      const data = await response.json();
      setReportData(data);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке отчетов');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleExport = async (type: string) => {
    try {
      const query = new URLSearchParams({ ...filters, type }).toString();
      const response = await fetch(`/api/admin/reports/export?${query}`);
      if (!response.ok) {
        throw new Error('Failed to export report');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${type}_${formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Отчет успешно экспортирован');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при экспорте отчета');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ошибка загрузки данных отчетов</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Отчеты и аналитика</h1>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-gray-500" /> Фильтры отчетов
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="startDate">Дата от</Label>
            <Input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
          </div>
          <div>
            <Label htmlFor="endDate">Дата до</Label>
            <Input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchReportData} className="w-full">
              Обновить отчеты
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Всего заявок</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {reportData.totalApplications.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Среднее время обработки</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {reportData.averageProcessingTime.toFixed(1)} ч
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Утверждено</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reportData.applicationsByStatus.find(s => s.status === ApplicationStatus.APPROVED)?.count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Отклонено</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reportData.applicationsByStatus.find(s => s.status === ApplicationStatus.REJECTED)?.count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Заявки по статусам</CardTitle>
            <Button onClick={() => handleExport('status')} variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" /> Экспорт
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.applicationsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      item.status === ApplicationStatus.APPROVED ? 'bg-green-500' :
                      item.status === ApplicationStatus.REJECTED ? 'bg-red-500' :
                      item.status === ApplicationStatus.UNDER_REVIEW ? 'bg-yellow-500' :
                      item.status === ApplicationStatus.ERROR ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="text-sm font-medium">{getStatusLabel(item.status)}</span>
                  </div>
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Applications by Payment Method */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Заявки по способам оплаты</CardTitle>
            <Button onClick={() => handleExport('payment')} variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" /> Экспорт
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.applicationsByPaymentMethod.map((item) => (
                <div key={item.paymentMethod} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      item.paymentMethod === PaymentMethod.KASPI ? 'bg-green-500' :
                      item.paymentMethod === PaymentMethod.CASH ? 'bg-orange-500' :
                      'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium">{getPaymentMethodLabel(item.paymentMethod)}</span>
                  </div>
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Centers and Managers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Service Center */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Заявки по сервисным центрам</CardTitle>
            <Button onClick={() => handleExport('service-centers')} variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" /> Экспорт
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.applicationsByServiceCenter.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{item.serviceCenter.number}</span>
                    <p className="text-xs text-gray-500">{item.serviceCenter.description}</p>
                  </div>
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Managers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Топ менеджеров</CardTitle>
            <Button onClick={() => handleExport('managers')} variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" /> Экспорт
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.topManagers.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-sm font-medium">{item.manager.email}</span>
                  </div>
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Динамика по месяцам</CardTitle>
          <Button onClick={() => handleExport('monthly')} variant="outline" size="sm">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" /> Экспорт
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.applicationsByMonth.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.month}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(item.count / Math.max(...reportData.applicationsByMonth.map(m => m.count))) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

