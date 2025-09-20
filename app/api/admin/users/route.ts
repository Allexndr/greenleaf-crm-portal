import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, createErrorResponse, getCurrentUser, validateRequiredFields, validateEmail } from '@/lib/api-helpers';
import { hashPassword, verifyToken } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { createAuditLogger, getClientIP, getUserAgent } from '@/lib/audit';

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

    // Only site admin can view all users
    if (user.role !== 'SITE_ADMIN') {
      return createErrorResponse('Доступ запрещен', 403);
    }

    const users = await prisma.user.findMany({
      include: {
        serviceCenter: {
          select: {
            id: true,
            number: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return createApiResponse(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return createErrorResponse('Не авторизован', 401);
    }

    // Only site admin can create users
    if (user.role !== 'SITE_ADMIN') {
      return createErrorResponse('Доступ запрещен', 403);
    }

    const body = await request.json();
    
    // Validate required fields
    const validationError = validateRequiredFields(body, ['email', 'role']);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // Validate email
    if (!validateEmail(body.email)) {
      return createErrorResponse('Некорректный email', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (existingUser) {
      return createErrorResponse('Пользователь с таким email уже существует', 400);
    }

    // Validate role
    if (!Object.values(UserRole).includes(body.role)) {
      return createErrorResponse('Некорректная роль', 400);
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

    // Hash password
    const hashedPassword = await hashPassword(body.password || 'temp123');

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        role: body.role,
        serviceCenterId: body.serviceCenterId || null,
        isActive: true,
      },
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

    // Log user creation
    const auditLogger = createAuditLogger(user.id, user.serviceCenterId, request);
    await auditLogger.logUserCreated(newUser.id, {
      email: newUser.email,
      role: newUser.role,
      serviceCenterId: newUser.serviceCenterId,
    });

    return createApiResponse(newUser, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}
