import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, createErrorResponse } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceCenter = await prisma.serviceCenter.findUnique({
      where: {
        id: params.id,
        isActive: true,
      },
      select: {
        id: true,
        number: true,
        description: true,
        address: true,
      },
    });

    if (!serviceCenter) {
      return createErrorResponse('Сервисный центр не найден', 404);
    }

    return createApiResponse(serviceCenter);
  } catch (error) {
    console.error('Error fetching service center:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

