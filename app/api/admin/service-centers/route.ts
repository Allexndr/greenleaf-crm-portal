import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { connectToDatabase } from '@/lib/mongodb';
import { createApiResponse, createErrorResponse, getCurrentUser, validateRequiredFields } from '@/lib/api-helpers';
import { generateUniqueLink } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

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

    // Only site admin can view all service centers
    if (user.role !== 'SITE_ADMIN') {
      return createErrorResponse('Доступ запрещен', 403);
    }

    let serviceCenters: any[] = [];

    try {
      // Try MongoDB first
      const { db } = await connectToDatabase();
      const mongoServiceCenters = await db.collection('serviceCenters')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      // Get counts for each service center
      serviceCenters = await Promise.all(mongoServiceCenters.map(async (sc) => {
        const applicationsCount = await db.collection('applications').countDocuments({
          serviceCenterId: sc._id,
        });
        
        const usersCount = await db.collection('users').countDocuments({
          serviceCenterId: sc._id,
        });

        return {
          id: sc._id.toString(),
          number: sc.number,
          description: sc.description,
          address: sc.address,
          uniqueLink: sc.uniqueLink || '',
          greenleafLogin: sc.greenleafLogin || '',
          greenleafPassword: sc.greenleafPassword || '',
          isActive: sc.isActive,
          createdAt: sc.createdAt,
          updatedAt: sc.updatedAt,
          _count: {
            applications: applicationsCount,
            users: usersCount,
          },
        };
      }));

    } catch (mongoError) {
      console.warn('MongoDB failed, trying Prisma:', mongoError);
      
      // Fallback to Prisma
      try {
        serviceCenters = await prisma.serviceCenter.findMany({
          include: {
            _count: {
              select: {
                applications: true,
                users: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      } catch (prismaError) {
        console.error('Both MongoDB and Prisma failed:', prismaError);
        return createErrorResponse('Ошибка подключения к базе данных', 500);
      }
    }

    return createApiResponse(serviceCenters);
  } catch (error) {
    console.error('Error fetching service centers:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

export async function POST(request: NextRequest) {
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

    // Only site admin can create service centers
    if (user.role !== 'SITE_ADMIN') {
      return createErrorResponse('Доступ запрещен', 403);
    }

    const body = await request.json();
    
    // Validate required fields
    const validationError = validateRequiredFields(body, ['number', 'description', 'address']);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // Check if service center number already exists
    const existingCenter = await prisma.serviceCenter.findUnique({
      where: {
        number: body.number,
      },
    });

    if (existingCenter) {
      return createErrorResponse('Сервисный центр с таким номером уже существует', 400);
    }

    // Generate unique link
    const uniqueLink = generateUniqueLink(body.number);

    // Create service center
    const serviceCenter = await prisma.serviceCenter.create({
      data: {
        number: body.number,
        description: body.description,
        address: body.address,
        uniqueLink,
        greenleafLogin: body.greenleafLogin || '',
        greenleafPassword: body.greenleafPassword || '',
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

    return createApiResponse(serviceCenter, 201);
  } catch (error) {
    console.error('Error creating service center:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

