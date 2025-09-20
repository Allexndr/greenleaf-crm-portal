'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { UserRole } from '@/lib/types';
import { PlusIcon, PencilIcon, TrashIcon, KeyIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  serviceCenter?: {
    id: string;
    number: string;
    description: string;
  };
}

interface ServiceCenter {
  id: string;
  number: string;
  description: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: UserRole.MANAGER,
    serviceCenterId: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchServiceCenters();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке пользователей');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser 
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save user');
      }

      toast.success(editingUser ? 'Пользователь обновлен' : 'Пользователь создан');
      await fetchUsers();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сохранении');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      role: user.role,
      serviceCenterId: user.serviceCenter?.id || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      toast.success('Пользователь удален');
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при удалении');
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!confirm('Сбросить пароль для этого пользователя?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset password');
      }

      toast.success('Пароль сброшен');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сбросе пароля');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      role: UserRole.MANAGER,
      serviceCenterId: '',
    });
    setEditingUser(null);
    setShowForm(false);
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case UserRole.SITE_ADMIN:
        return 'Админ сайта';
      case UserRole.SERVICE_CENTER_ADMIN:
        return 'Админ центра';
      case UserRole.MANAGER:
        return 'Менеджер';
      default:
        return 'Неизвестно';
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Пользователи</h1>
        <Button onClick={() => setShowForm(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Добавить пользователя
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingUser ? 'Редактировать пользователя' : 'Новый пользователь'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">
                    Пароль {editingUser ? '(оставьте пустым для сохранения текущего)' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Введите пароль"
                    required={!editingUser}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Роль *</Label>
                  <Select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    required
                  >
                    <option value={UserRole.MANAGER}>Менеджер</option>
                    <option value={UserRole.SERVICE_CENTER_ADMIN}>Админ центра</option>
                    <option value={UserRole.SITE_ADMIN}>Админ сайта</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="serviceCenterId">Сервисный центр</Label>
                  <Select
                    id="serviceCenterId"
                    value={formData.serviceCenterId}
                    onChange={(e) => setFormData({ ...formData, serviceCenterId: e.target.value })}
                  >
                    <option value="">Выберите центр</option>
                    {serviceCenters.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.number} - {sc.description}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingUser ? 'Обновить' : 'Создать'}
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
          <CardTitle>Список пользователей</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Пользователи не найдены
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Роль
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сервисный центр
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getRoleLabel(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.serviceCenter ? `${user.serviceCenter.number} - ${user.serviceCenter.description}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Редактировать"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Сбросить пароль"
                          >
                            <KeyIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
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
