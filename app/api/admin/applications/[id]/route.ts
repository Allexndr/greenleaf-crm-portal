import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { verifyToken } from '@/lib/auth';
import { ApplicationStatus } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const application = await prisma.application.findUnique({
      where: {
        id: params.id,
      },
      include: {
        serviceCenter: {
          select: {
            id: true,
            number: true,
            description: true,
            address: true,
          },
        },
        manager: {
          select: {
            id: true,
            email: true,
          },
        },
        history: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!application) {
      return createErrorResponse('Заявка не найдена', 404);
    }

    // Check if user has access to this application
    if (user.role !== 'SITE_ADMIN' && user.serviceCenterId !== application.serviceCenterId) {
      return createErrorResponse('Доступ запрещен', 403);
    }

    return createApiResponse(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

