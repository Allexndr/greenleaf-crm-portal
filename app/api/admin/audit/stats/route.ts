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
    const serviceCenterId = searchParams.get('serviceCenterId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};

    // Filter by service center if user is not site admin
    if (user.role !== 'SITE_ADMIN' && user.serviceCenterId) {
      where.serviceCenterId = user.serviceCenterId;
    } else if (serviceCenterId) {
      where.serviceCenterId = serviceCenterId;
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

    const [totalLogs, actionCounts, recentLogs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
      }),
      prisma.auditLog.findMany({
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
        take: 50,
      }),
    ]);

    return createApiResponse({
      totalLogs,
      actionCounts,
      recentLogs,
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

