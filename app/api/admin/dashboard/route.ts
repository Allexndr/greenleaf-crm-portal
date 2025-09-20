import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { ApplicationStatus } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return createErrorResponse('Не авторизован', 401);
    }

    // Build where clause for service center filtering
    const where: any = {};
    if (user.role !== 'SITE_ADMIN' && user.serviceCenterId) {
      where.serviceCenterId = user.serviceCenterId;
    }

    // Get application counts by status
    const [
      totalApplications,
      newApplications,
      underReviewApplications,
      approvedApplications,
      rejectedApplications,
      errorApplications,
    ] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.count({ where: { ...where, status: ApplicationStatus.NEW } }),
      prisma.application.count({ where: { ...where, status: ApplicationStatus.UNDER_REVIEW } }),
      prisma.application.count({ where: { ...where, status: ApplicationStatus.APPROVED } }),
      prisma.application.count({ where: { ...where, status: ApplicationStatus.REJECTED } }),
      prisma.application.count({ where: { ...where, status: ApplicationStatus.ERROR } }),
    ]);

    // Get recent applications
    const recentApplications = await prisma.application.findMany({
      where,
      include: {
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
      take: 10,
    });

    return createApiResponse({
      totalApplications,
      newApplications,
      underReviewApplications,
      approvedApplications,
      rejectedApplications,
      errorApplications,
      recentApplications,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

