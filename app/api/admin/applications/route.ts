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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const serviceCenterId = searchParams.get('serviceCenterId');
    const managerId = searchParams.get('managerId');
    const paymentMethod = searchParams.get('paymentMethod');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
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

    if (status) {
      where.status = status;
    }

    if (managerId) {
      where.managerId = managerId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (search) {
      where.OR = [
        { applicationNumber: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
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

    const applications = await prisma.application.findMany({
      where,
      include: {
        serviceCenter: {
          select: {
            id: true,
            number: true,
            description: true,
          },
        },
        manager: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.application.count({ where });

    return createApiResponse({
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

