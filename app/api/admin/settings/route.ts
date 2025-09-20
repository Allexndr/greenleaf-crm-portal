import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, createErrorResponse, getCurrentUser } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
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

    return createApiResponse(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
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
