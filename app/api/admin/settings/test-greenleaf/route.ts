import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { verifyToken } from '@/lib/auth';
import { greenleafAPI } from '@/lib/greenleaf-api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Try to get user from headers first (from middleware)
    let user = getCurrentUser(request);
    
    // If not found, try to get from cookie directly
    if (!user) {
      const token = request.cookies.get('auth-token')?.value;
      if (token) {
        const payload = verifyToken(token);
        if (payload) {
          user = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            serviceCenterId: payload.serviceCenterId,
          };
        }
      }
    }
    
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
