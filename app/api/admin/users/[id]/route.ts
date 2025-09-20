import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, createErrorResponse, getCurrentUser, validateEmail } from '@/lib/api-helpers';
import { hashPassword, verifyToken } from '@/lib/auth';
import { UserRole } from '@/lib/types';
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

    // Only site admin can update users
    if (user.role !== 'SITE_ADMIN') {
      return createErrorResponse('Доступ запрещен', 403);
    }

    const body = await request.json();

    // Validate email if provided
    if (body.email && !validateEmail(body.email)) {
      return createErrorResponse('Некорректный email', 400);
    }

    // Validate role if provided
    if (body.role && !Object.values(UserRole).includes(body.role)) {
      return createErrorResponse('Некорректная роль', 400);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingUser) {
      return createErrorResponse('Пользователь не найден', 404);
    }

    // Check if email is already taken by another user
    if (body.email && body.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: {
          email: body.email,
        },
      });

      if (emailTaken) {
        return createErrorResponse('Пользователь с таким email уже существует', 400);
      }
    }

    // Validate service center assignment
    if (body.serviceCenterId) {
      const serviceCenter = await prisma.serviceCenter.findUnique({
        where: {
          id: body.serviceCenterId,
        },
      });

      if (!serviceCenter) {
        return createErrorResponse('Сервисный центр не найден', 400);
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (body.email) updateData.email = body.email;
    if (body.role) updateData.role = body.role;
    if (body.serviceCenterId !== undefined) updateData.serviceCenterId = body.serviceCenterId || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    
    if (body.password) {
      updateData.password = await hashPassword(body.password);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: updateData,
      include: {
        serviceCenter: {
          select: {
            id: true,
            number: true,
            description: true,
          },
        },
      },
    });

    // Log user update
    const auditLogger = createAuditLogger(user.id, user.serviceCenterId, request);
    await auditLogger.logUserUpdated(updatedUser.id, {
      changes: updateData,
      timestamp: new Date().toISOString(),
    });

    return createApiResponse(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
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

    // Only site admin can delete users
    if (user.role !== 'SITE_ADMIN') {
      return createErrorResponse('Доступ запрещен', 403);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingUser) {
      return createErrorResponse('Пользователь не найден', 404);
    }

    // Prevent deletion of self
    if (existingUser.id === user.id) {
      return createErrorResponse('Нельзя удалить самого себя', 400);
    }

    // Delete user
    await prisma.user.delete({
      where: {
        id: params.id,
      },
    });

    // Log user deletion
    const auditLogger = createAuditLogger(user.id, user.serviceCenterId, request);
    await auditLogger.logUserDeleted(existingUser.id);

    return createApiResponse({ message: 'Пользователь удален' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}
