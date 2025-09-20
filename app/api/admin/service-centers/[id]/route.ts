import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, createErrorResponse, getCurrentUser, validateRequiredFields } from '@/lib/api-helpers';
import { verifyToken } from '@/lib/auth';
import { generateUniqueLink } from '@/lib/utils';
import { createAuditLogger, getClientIP, getUserAgent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PUT(
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

    // Only site admin can update service centers
    if (user.role !== 'SITE_ADMIN') {
      return createErrorResponse('Доступ запрещен', 403);
    }

    const body = await request.json();
    
    // Validate required fields
    const validationError = validateRequiredFields(body, ['number', 'description', 'address']);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // Check if service center exists
    const existingCenter = await prisma.serviceCenter.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingCenter) {
      return createErrorResponse('Сервисный центр не найден', 404);
    }

    // Check if service center number already exists (excluding current one)
    const duplicateCenter = await prisma.serviceCenter.findFirst({
      where: {
        number: body.number,
        id: {
          not: params.id,
        },
      },
    });

    if (duplicateCenter) {
      return createErrorResponse('Сервисный центр с таким номером уже существует', 400);
    }

    // Update service center
    const updatedCenter = await prisma.serviceCenter.update({
      where: {
        id: params.id,
      },
      data: {
        number: body.number,
        description: body.description,
        address: body.address,
        greenleafLogin: body.greenleafLogin || existingCenter.greenleafLogin,
        greenleafPassword: body.greenleafPassword || existingCenter.greenleafPassword,
        isActive: body.isActive !== undefined ? body.isActive : existingCenter.isActive,
      },
      include: {
        _count: {
          select: {
            applications: true,
            users: true,
          },
        },
      },
    });

    // Log service center update
    const auditLogger = createAuditLogger(user.id, user.serviceCenterId, request);
    await auditLogger.logServiceCenterUpdated(updatedCenter.id, {
      changes: body,
      timestamp: new Date().toISOString(),
    });

    return createApiResponse(updatedCenter);
  } catch (error) {
    console.error('Error updating service center:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return createErrorResponse('Не авторизован', 401);
    }

    // Only site admin can delete service centers
    if (user.role !== 'SITE_ADMIN') {
      return createErrorResponse('Доступ запрещен', 403);
    }

    // Check if service center exists
    const existingCenter = await prisma.serviceCenter.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingCenter) {
      return createErrorResponse('Сервисный центр не найден', 404);
    }

    // Check if service center has applications or users
    const applicationsCount = await prisma.application.count({
      where: {
        serviceCenterId: params.id,
      },
    });

    const usersCount = await prisma.user.count({
      where: {
        serviceCenterId: params.id,
      },
    });

    if (applicationsCount > 0 || usersCount > 0) {
      return createErrorResponse(
        `Нельзя удалить сервисный центр с заявками (${applicationsCount}) или пользователями (${usersCount})`,
        400
      );
    }

    // Delete service center
    await prisma.serviceCenter.delete({
      where: {
        id: params.id,
      },
    });

    // Log service center deletion
    const auditLogger = createAuditLogger(user.id, user.serviceCenterId, request);
    await auditLogger.logServiceCenterDeleted(existingCenter.id);

    return createApiResponse({ message: 'Сервисный центр удален' });
  } catch (error) {
    console.error('Error deleting service center:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}
