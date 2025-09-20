import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, createErrorResponse, getCurrentUser } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return createErrorResponse('Не авторизован', 401);
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const serviceCenterId = searchParams.get('serviceCenterId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {};

    // Filter by service center if user is not site admin
    if (user.role !== 'SITE_ADMIN' && user.serviceCenterId) {
      where.serviceCenterId = user.serviceCenterId;
    } else if (serviceCenterId) {
      where.serviceCenterId = serviceCenterId;
    }

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { details: { contains: search } },
        { ipAddress: { contains: search } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
        serviceCenter: {
          select: {
            number: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.auditLog.count({ where });

    return createApiResponse({
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

