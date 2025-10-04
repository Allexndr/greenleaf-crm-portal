import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { connectToDatabase } from '@/lib/mongodb';
import { createApiResponse, createErrorResponse, getCurrentUser, validateRequiredFields, validateEmail } from '@/lib/api-helpers';
import { hashPassword, verifyToken } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { getAuditLogger, AuditActions } from '@/lib/audit';

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

    let users: any[] = [];

    try {
      // Try MongoDB first (since we want to use MongoDB)
      const { db } = await connectToDatabase();
      const mongoUsers = await db.collection('users').find({}).sort({ createdAt: -1 }).toArray();
      
      // Get service centers for each user
      users = await Promise.all(mongoUsers.map(async (user) => {
        let serviceCenter = null;
        if (user.serviceCenterId) {
          serviceCenter = await db.collection('serviceCenters').findOne({
            _id: user.serviceCenterId,
          });
        }
        
        return {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          serviceCenter: serviceCenter ? {
            id: serviceCenter._id.toString(),
            number: serviceCenter.number,
            description: serviceCenter.description,
          } : null,
        };
      }));
    } catch (mongoError) {
      console.warn('MongoDB failed, trying Prisma:', mongoError);
      
      // Fallback to Prisma
      try {
        users = await prisma.user.findMany({
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
      } catch (prismaError) {
        console.error('Both MongoDB and Prisma failed:', prismaError);
        return createErrorResponse('Ошибка подключения к базе данных', 500);
      }
    }

    return createApiResponse(users);
  } catch (error) {
    console.error('Error fetching users:', error);
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

    let existingUser: any = null;
    let newUser: any = null;

    try {
      // Try MongoDB first (since we want to use MongoDB)
      const { db } = await connectToDatabase();
      
      // Check if user already exists in MongoDB
      existingUser = await db.collection('users').findOne({
        email: body.email,
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
        const serviceCenter = await db.collection('serviceCenters').findOne({
          _id: body.serviceCenterId,
        });

        if (!serviceCenter) {
          return createErrorResponse('Сервисный центр не найден', 400);
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(body.password || 'temp123');

      // Create user in MongoDB
      const mongoUser = {
        email: body.email,
        password: hashedPassword,
        role: body.role,
        serviceCenterId: body.serviceCenterId || null,
        isActive: true,
        firstName: body.firstName || '',
        lastName: body.lastName || '',
        phone: body.phone || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('users').insertOne(mongoUser);
      
      // Get service center info
      let serviceCenter = null;
      if (body.serviceCenterId) {
        serviceCenter = await db.collection('serviceCenters').findOne({
          _id: body.serviceCenterId,
        });
      }

      newUser = {
        id: result.insertedId.toString(),
        email: body.email,
        role: body.role,
        isActive: true,
        createdAt: mongoUser.createdAt,
        serviceCenter: serviceCenter ? {
          id: serviceCenter._id.toString(),
          number: serviceCenter.number,
          description: serviceCenter.description,
        } : null,
      };
    } catch (mongoError) {
      console.warn('MongoDB failed, trying Prisma:', mongoError);
      
      // Fallback to Prisma
      try {
        existingUser = await prisma.user.findUnique({
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
        newUser = await prisma.user.create({
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
      } catch (prismaError) {
        console.error('Both MongoDB and Prisma failed:', prismaError);
        return createErrorResponse('Ошибка подключения к базе данных', 500);
      }
    }

    // Log user creation
    try {
      const auditLogger = createAuditLogger(user.id, user.serviceCenterId, request);
      await auditLogger.logUserCreated(newUser.id, {
        email: newUser.email,
        role: newUser.role,
        serviceCenterId: newUser.serviceCenterId,
      });
    } catch (auditError) {
      console.warn('Audit logging failed:', auditError);
    }

    return createApiResponse(newUser, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}
