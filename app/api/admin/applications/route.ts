import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { connectToDatabase } from '@/lib/mongodb';
import { createApiResponse, createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { ApplicationStatus } from '@/lib/types';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

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

    let applications: any[] = [];
    let total = 0;

    try {
      // Try MongoDB first
      const { db } = await connectToDatabase();
      
      // Build MongoDB filter
      const filter: any = {};

      // Filter by service center if user is not site admin
      if (user.role !== 'SITE_ADMIN' && user.serviceCenterId) {
        filter.serviceCenterId = new ObjectId(user.serviceCenterId);
      } else if (serviceCenterId) {
        filter.serviceCenterId = new ObjectId(serviceCenterId);
      }

      if (status) {
        filter.status = status;
      }

      if (managerId) {
        filter.managerId = new ObjectId(managerId);
      }

      if (paymentMethod) {
        filter.paymentMethod = paymentMethod;
      }

      if (search) {
        filter.$or = [
          { applicationNumber: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
          filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
        }
      }

      // Get applications from MongoDB
      const mongoApplications = await db.collection('applications')
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      // Get service centers for each application
      applications = await Promise.all(mongoApplications.map(async (app) => {
        let serviceCenter = null;
        if (app.serviceCenterId) {
          serviceCenter = await db.collection('serviceCenters').findOne({
            _id: app.serviceCenterId,
          });
        }

        let manager = null;
        if (app.managerId) {
          manager = await db.collection('users').findOne({
            _id: app.managerId,
          });
        }

        return {
          id: app._id.toString(),
          applicationNumber: app.applicationNumber,
          firstName: app.firstName,
          lastName: app.lastName,
          phone: app.phone,
          email: app.email,
          sponsor: app.sponsor,
          placement: app.placement,
          idNumber: app.idNumber,
          placementArea: app.placementArea,
          paymentMethod: app.paymentMethod,
          status: app.status,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          serviceCenter: serviceCenter ? {
            id: serviceCenter._id.toString(),
            number: serviceCenter.number,
            description: serviceCenter.description,
          } : null,
          manager: manager ? {
            id: manager._id.toString(),
            email: manager.email,
          } : null,
        };
      }));

      // Get total count
      total = await db.collection('applications').countDocuments(filter);

    } catch (mongoError) {
      console.warn('MongoDB failed, trying Prisma:', mongoError);
      
      // Fallback to Prisma
      try {
        // Build where clause for Prisma
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

        applications = await prisma.application.findMany({
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

        total = await prisma.application.count({ where });
      } catch (prismaError) {
        console.error('Both MongoDB and Prisma failed:', prismaError);
        return createErrorResponse('Ошибка подключения к базе данных', 500);
      }
    }

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

