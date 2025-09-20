import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { greenleafAPI } from '@/lib/greenleaf-api';

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return createErrorResponse('Не авторизован', 401);
    }

    // Only site admin can test Greenleaf connection
    if (user.role !== 'SITE_ADMIN') {
      return createErrorResponse('Доступ запрещен', 403);
    }

    // Test Greenleaf connection
    const result = await greenleafAPI.testConnection('test', 'test');

    if (result.success) {
      return createApiResponse({
        message: 'Подключение к Greenleaf успешно',
        success: true,
      });
    } else {
      return createApiResponse({
        message: 'Ошибка подключения к Greenleaf',
        error: result.error,
        success: false,
      }, 400);
    }
  } catch (error) {
    console.error('Error testing Greenleaf connection:', error);
    return createErrorResponse('Ошибка при тестировании подключения', 500);
  }
}
