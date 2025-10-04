'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ServiceCenter {
  id: string;
  number: string;
  description: string;
  address: string;
  uniqueLink: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    applications: number;
    users: number;
  };
}

export default function ServiceCentersPage() {
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCenter, setEditingCenter] = useState<ServiceCenter | null>(null);
  const [formData, setFormData] = useState({
    number: '',
    description: '',
    address: '',
    greenleafLogin: '',
    greenleafPassword: '',
  });

  useEffect(() => {
    fetchServiceCenters();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCenter 
        ? `/api/admin/service-centers/${editingCenter.id}`
        : '/api/admin/service-centers';
      const method = editingCenter ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save service center');
      }

      toast.success(editingCenter ? 'Сервисный центр обновлен' : 'Сервисный центр создан');
      await fetchServiceCenters();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сохранении');
    }
  };

  const handleEdit = (center: ServiceCenter) => {
    setEditingCenter(center);
    setFormData({
      number: center.number,
      description: center.description,
      address: center.address,
      greenleafLogin: '',
      greenleafPassword: '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот сервисный центр?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/service-centers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete service center');
      }

      toast.success('Сервисный центр удален');
      await fetchServiceCenters();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при удалении');
    }
  };

  const resetForm = () => {
    setFormData({
      number: '',
      description: '',
      address: '',
      greenleafLogin: '',
      greenleafPassword: '',
    });
    setEditingCenter(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Сервисные центры</h1>
        <Button onClick={() => setShowForm(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Добавить центр
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCenter ? 'Редактировать сервисный центр' : 'Новый сервисный центр'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="number">Номер центра *</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="S240350"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Описание *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Название центра"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Адрес *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Полный адрес сервисного центра"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="greenleafLogin">Логин Greenleaf</Label>
                  <Input
                    id="greenleafLogin"
                    value={formData.greenleafLogin}
                    onChange={(e) => setFormData({ ...formData, greenleafLogin: e.target.value })}
                    placeholder="Логин для Greenleaf"
                  />
                </div>
                <div>
                  <Label htmlFor="greenleafPassword">Пароль Greenleaf</Label>
                  <Input
                    id="greenleafPassword"
                    type="password"
                    value={formData.greenleafPassword}
                    onChange={(e) => setFormData({ ...formData, greenleafPassword: e.target.value })}
                    placeholder="Пароль для Greenleaf"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingCenter ? 'Обновить' : 'Создать'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Список сервисных центров</CardTitle>
        </CardHeader>
        <CardContent>
          {serviceCenters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Сервисные центры не найдены
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номер
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Описание
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Адрес
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ссылка
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Последнее обновление
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статистика
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {serviceCenters.map((center) => (
                    <tr key={center.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {center.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {center.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {center.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <a
                          href={center.uniqueLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-900"
                        >
                          {center.uniqueLink}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(center.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(center.updatedAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div>Заявок: {center._count.applications}</div>
                          <div>Пользователей: {center._count.users}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          center.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {center.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(center)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Редактировать"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {/* TODO: Implement regenerate link */}}
                            className="text-blue-600 hover:text-blue-900"
                            title="Пере-сгенерировать ссылку"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {/* TODO: Implement deactivate */}}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Деактивировать"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(center.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Удалить"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
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

