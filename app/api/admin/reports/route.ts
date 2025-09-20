import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { verifyToken } from '@/lib/auth';
import { ApplicationStatus, PaymentMethod } from '@/lib/types';

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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const serviceCenterId = searchParams.get('serviceCenterId');

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

    // Get total applications
    const totalApplications = await prisma.application.count({ where });

    // Get applications by status
    const applicationsByStatus = await prisma.application.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true,
      },
    });

    // Get applications by payment method
    const applicationsByPaymentMethod = await prisma.application.groupBy({
      by: ['paymentMethod'],
      where,
      _count: {
        paymentMethod: true,
      },
    });

    // Get applications by service center
    const applicationsByServiceCenter = await prisma.application.groupBy({
      by: ['serviceCenterId'],
      where,
      _count: {
        serviceCenterId: true,
      },
      orderBy: {
        _count: {
          serviceCenterId: 'desc',
        },
      },
      take: 10,
    });

    // Get service center details
    const serviceCenterIds = applicationsByServiceCenter.map(item => item.serviceCenterId);
    const serviceCenters = await prisma.serviceCenter.findMany({
      where: {
        id: {
          in: serviceCenterIds,
        },
      },
      select: {
        id: true,
        number: true,
        description: true,
      },
    });

    const applicationsByServiceCenterWithDetails = applicationsByServiceCenter.map(item => ({
      serviceCenter: serviceCenters.find(sc => sc.id === item.serviceCenterId) || {
        number: 'Unknown',
        description: 'Unknown',
      },
      count: item._count.serviceCenterId,
    }));

    // Get applications by month - simplified approach
    const applications = await prisma.application.findMany({
      where: {
        ...where,
        createdAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by month
    const monthCounts: { [key: string]: number } = {};
    applications.forEach(app => {
      const month = app.createdAt.toISOString().substring(0, 7); // YYYY-MM
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    const applicationsByMonth = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);

    // Calculate average processing time
    const processingTimes = await prisma.application.findMany({
      where: {
        ...where,
        status: {
          in: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],
        },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, app) => {
          const hours = (app.updatedAt.getTime() - app.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / processingTimes.length
      : 0;

    // Get top managers
    const topManagers = await prisma.application.groupBy({
      by: ['managerId'],
      where: {
        ...where,
        managerId: {
          not: null,
        },
      },
      _count: {
        managerId: true,
      },
      orderBy: {
        _count: {
          managerId: 'desc',
        },
      },
      take: 10,
    });

    // Get manager details
    const managerIds = topManagers.map(item => item.managerId).filter(Boolean);
    const managers = await prisma.user.findMany({
      where: {
        id: {
          in: managerIds,
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    const topManagersWithDetails = topManagers.map(item => ({
      manager: managers.find(m => m.id === item.managerId) || {
        email: 'Unknown',
      },
      count: item._count.managerId,
    }));

    return createApiResponse({
      totalApplications,
      applicationsByStatus: applicationsByStatus.map(item => ({
        status: item.status,
        count: item._count.status,
      })),
      applicationsByPaymentMethod: applicationsByPaymentMethod.map(item => ({
        paymentMethod: item.paymentMethod,
        count: item._count.paymentMethod,
      })),
      applicationsByServiceCenter: applicationsByServiceCenterWithDetails,
      applicationsByMonth: applicationsByMonth.map(item => ({
        month: item.month,
        count: Number(item.count),
      })),
      averageProcessingTime,
      topManagers: topManagersWithDetails,
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

