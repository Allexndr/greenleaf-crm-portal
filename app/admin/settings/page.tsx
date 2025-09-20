'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CogIcon, CheckIcon, BeakerIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface SystemSettings {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setSettings(data);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке настроек');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.key === key ? { ...setting, value } : setting
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Настройки сохранены');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleTestGreenleafConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/admin/settings/test-greenleaf', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Подключение к Greenleaf успешно');
      } else {
        toast.error(result.error || 'Ошибка подключения к Greenleaf');
      }
    } catch (error: any) {
      toast.error('Ошибка при тестировании подключения');
    } finally {
      setTesting(false);
    }
  };

  const getSettingValue = (key: string): string => {
    return settings.find(s => s.key === key)?.value || '';
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
      <h1 className="text-3xl font-bold text-gray-900">Настройки системы</h1>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CogIcon className="h-5 w-5 text-gray-500" /> Общие настройки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="default_temp_password">Временный пароль по умолчанию</Label>
              <Input
                id="default_temp_password"
                value={getSettingValue('DEFAULT_TEMP_PASSWORD')}
                onChange={(e) => handleSettingChange('DEFAULT_TEMP_PASSWORD', e.target.value)}
                placeholder="Aa12345"
              />
              <p className="text-xs text-gray-500 mt-1">
                Пароль, который назначается новым пользователям
              </p>
            </div>
            <div>
              <Label htmlFor="processing_interval">Интервал обработки (мс)</Label>
              <Input
                id="processing_interval"
                type="number"
                value={getSettingValue('PROCESSING_INTERVAL')}
                onChange={(e) => handleSettingChange('PROCESSING_INTERVAL', e.target.value)}
                placeholder="30000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Интервал обработки очереди заявок в миллисекундах
              </p>
            </div>
          </div>
          <div>
            <Label htmlFor="max_file_size">Максимальный размер файла (байт)</Label>
            <Input
              id="max_file_size"
              type="number"
              value={getSettingValue('MAX_FILE_SIZE')}
              onChange={(e) => handleSettingChange('MAX_FILE_SIZE', e.target.value)}
              placeholder="5242880"
            />
            <p className="text-xs text-gray-500 mt-1">
              Максимальный размер загружаемых файлов (по умолчанию 5MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Greenleaf Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BeakerIcon className="h-5 w-5 text-gray-500" /> Настройки Greenleaf
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="greenleaf_api_url">URL API Greenleaf</Label>
              <Input
                id="greenleaf_api_url"
                value={getSettingValue('GREENLEAF_API_URL')}
                onChange={(e) => handleSettingChange('GREENLEAF_API_URL', e.target.value)}
                placeholder="https://greenleaf-global.com/api"
              />
            </div>
            <div>
              <Label htmlFor="greenleaf_api_key">API ключ Greenleaf</Label>
              <Input
                id="greenleaf_api_key"
                type="password"
                value={getSettingValue('GREENLEAF_API_KEY')}
                onChange={(e) => handleSettingChange('GREENLEAF_API_KEY', e.target.value)}
                placeholder="your-api-key"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleTestGreenleafConnection}
              disabled={testing}
              variant="outline"
            >
              <BeakerIcon className="h-4 w-4 mr-2" />
              {testing ? 'Тестирование...' : 'Тест подключения'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Настройки уведомлений</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtp_host">SMTP хост</Label>
              <Input
                id="smtp_host"
                value={getSettingValue('SMTP_HOST')}
                onChange={(e) => handleSettingChange('SMTP_HOST', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <Label htmlFor="smtp_port">SMTP порт</Label>
              <Input
                id="smtp_port"
                type="number"
                value={getSettingValue('SMTP_PORT')}
                onChange={(e) => handleSettingChange('SMTP_PORT', e.target.value)}
                placeholder="587"
              />
            </div>
            <div>
              <Label htmlFor="smtp_user">SMTP пользователь</Label>
              <Input
                id="smtp_user"
                value={getSettingValue('SMTP_USER')}
                onChange={(e) => handleSettingChange('SMTP_USER', e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="smtp_password">SMTP пароль</Label>
              <Input
                id="smtp_password"
                type="password"
                value={getSettingValue('SMTP_PASSWORD')}
                onChange={(e) => handleSettingChange('SMTP_PASSWORD', e.target.value)}
                placeholder="password"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Настройки безопасности</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="session_timeout">Таймаут сессии (часы)</Label>
              <Input
                id="session_timeout"
                type="number"
                value={getSettingValue('SESSION_TIMEOUT')}
                onChange={(e) => handleSettingChange('SESSION_TIMEOUT', e.target.value)}
                placeholder="24"
              />
            </div>
            <div>
              <Label htmlFor="max_login_attempts">Максимум попыток входа</Label>
              <Input
                id="max_login_attempts"
                type="number"
                value={getSettingValue('MAX_LOGIN_ATTEMPTS')}
                onChange={(e) => handleSettingChange('MAX_LOGIN_ATTEMPTS', e.target.value)}
                placeholder="5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <CheckIcon className="h-4 w-4 mr-2" />
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </Button>
      </div>
    </div>
  );
}
