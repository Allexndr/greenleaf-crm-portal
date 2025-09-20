'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ApplicationStatus, getStatusLabel } from '@/lib/types';

interface DashboardStats {
  totalApplications: number;
  newApplications: number;
  underReviewApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  errorApplications: number;
  recentApplications: Array<{
    id: string;
    applicationNumber: string;
    firstName: string;
    lastName: string;
    status: ApplicationStatus;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ошибка загрузки данных</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Панель администратора</h1>
        <p className="text-gray-600 mt-2">Обзор системы регистрации</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Всего заявок</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalApplications}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Новые</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.newApplications}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">На рассмотрении</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.underReviewApplications}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Утверждены</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approvedApplications}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Отклонены</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejectedApplications}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Ошибки</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.errorApplications}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Последние заявки</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Номер заявки
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ФИО
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата подачи
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentApplications.map((app) => (
                  <tr key={app.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {app.applicationNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.lastName} {app.firstName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${
                        app.status === ApplicationStatus.NEW ? 'status-new' :
                        app.status === ApplicationStatus.UNDER_REVIEW ? 'status-under-review' :
                        app.status === ApplicationStatus.APPROVED ? 'status-approved' :
                        app.status === ApplicationStatus.REJECTED ? 'status-rejected' :
                        'status-error'
                      }`}>
                        {getStatusLabel(app.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

