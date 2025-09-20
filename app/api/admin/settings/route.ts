import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Only site admin can view settings
    if (user.role !== 'SITE_ADMIN') {
      return createErrorResponse('Доступ запрещен', 403);
    }

    const settings = await prisma.systemSettings.findMany({
      orderBy: {
        key: 'asc',
      },
    });

    const response = createApiResponse(settings);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    
    return response;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

export async function PUT(request: NextRequest) {
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

    // Only site admin can update settings
    if (user.role !== 'SITE_ADMIN') {
      return createErrorResponse('Доступ запрещен', 403);
    }

    const body = await request.json();
    
    if (!Array.isArray(body)) {
      return createErrorResponse('Неверный формат данных', 400);
    }

    // Update settings
    const updatedSettings = [];
    for (const setting of body) {
      const updated = await prisma.systemSettings.upsert({
        where: {
          key: setting.key,
        },
        update: {
          value: setting.value,
        },
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description,
        },
      });
      updatedSettings.push(updated);
    }

    return createApiResponse(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}
