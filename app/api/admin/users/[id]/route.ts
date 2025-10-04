import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { connectToDatabase } from '@/lib/mongodb';
import { createApiResponse, createErrorResponse, getCurrentUser, validateEmail } from '@/lib/api-helpers';
import { hashPassword, verifyToken } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { getAuditLogger, AuditActions } from '@/lib/audit';
import { ObjectId } from 'mongodb';

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

    let existingUser: any = null;
    let updatedUser: any = null;

    try {
      // Try Prisma first
      existingUser = await prisma.user.findUnique({
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
      updatedUser = await prisma.user.update({
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
    } catch (prismaError) {
      console.warn('Prisma failed, using MongoDB:', prismaError);
      
      // Fallback to MongoDB
      const { db } = await connectToDatabase();
      
      // Check if user exists in MongoDB
      existingUser = await db.collection('users').findOne({
        _id: new ObjectId(params.id),
      });

      if (!existingUser) {
        return createErrorResponse('Пользователь не найден', 404);
      }

      // Check if email is already taken by another user
      if (body.email && body.email !== existingUser.email) {
        const emailTaken = await db.collection('users').findOne({
          email: body.email,
        });

        if (emailTaken) {
          return createErrorResponse('Пользователь с таким email уже существует', 400);
        }
      }

      // Validate service center assignment
      if (body.serviceCenterId) {
        const serviceCenter = await db.collection('serviceCenters').findOne({
          _id: new ObjectId(body.serviceCenterId),
        });

        if (!serviceCenter) {
          return createErrorResponse('Сервисный центр не найден', 400);
        }
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
      };
      
      if (body.email) updateData.email = body.email;
      if (body.role) updateData.role = body.role;
      if (body.serviceCenterId !== undefined) updateData.serviceCenterId = body.serviceCenterId || null;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      
      if (body.password) {
        updateData.password = await hashPassword(body.password);
      }

      // Update user in MongoDB
      await db.collection('users').updateOne(
        { _id: new ObjectId(params.id) },
        { $set: updateData }
      );

      // Get updated user with service center info
      const mongoUser = await db.collection('users').findOne({
        _id: new ObjectId(params.id),
      });

      let serviceCenter = null;
      if (mongoUser?.serviceCenterId) {
        serviceCenter = await db.collection('serviceCenters').findOne({
          _id: new ObjectId(mongoUser.serviceCenterId),
        });
      }

      updatedUser = {
        id: mongoUser._id.toString(),
        email: mongoUser.email,
        role: mongoUser.role,
        isActive: mongoUser.isActive,
        createdAt: mongoUser.createdAt,
        serviceCenter: serviceCenter ? {
          id: serviceCenter._id.toString(),
          number: serviceCenter.number,
          description: serviceCenter.description,
        } : null,
      };
    }

    // Log user update
    try {
      const auditLogger = createAuditLogger(user.id, user.serviceCenterId, request);
      await auditLogger.logUserUpdated(updatedUser.id, {
        changes: body,
        timestamp: new Date().toISOString(),
      });
    } catch (auditError) {
      console.warn('Audit logging failed:', auditError);
    }

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

    // Only site admin can delete users
    if (user.role !== 'SITE_ADMIN') {
      return createErrorResponse('Доступ запрещен', 403);
    }

    let existingUser: any = null;

    try {
      // Try Prisma first
      existingUser = await prisma.user.findUnique({
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
    } catch (prismaError) {
      console.warn('Prisma failed, using MongoDB:', prismaError);
      
      // Fallback to MongoDB
      const { db } = await connectToDatabase();
      
      // Check if user exists in MongoDB
      existingUser = await db.collection('users').findOne({
        _id: new ObjectId(params.id),
      });

      if (!existingUser) {
        return createErrorResponse('Пользователь не найден', 404);
      }

      // Prevent deletion of self
      if (existingUser._id.toString() === user.id) {
        return createErrorResponse('Нельзя удалить самого себя', 400);
      }

      // Delete user from MongoDB
      await db.collection('users').deleteOne({
        _id: new ObjectId(params.id),
      });
    }

    // Log user deletion
    try {
      const auditLogger = createAuditLogger(user.id, user.serviceCenterId, request);
      await auditLogger.logUserDeleted(existingUser.id || existingUser._id.toString());
    } catch (auditError) {
      console.warn('Audit logging failed:', auditError);
    }

    return createApiResponse({ message: 'Пользователь удален' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}
