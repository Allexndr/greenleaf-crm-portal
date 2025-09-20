import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { connectToDatabase } from '@/lib/mongodb';
import { createApiResponse, createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { verifyToken } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { createAuditLogger, getClientIP, getUserAgent } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function POST(
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

    // Only site admin can reset passwords
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

      // Generate new password
      const newPassword = 'temp123'; // You can generate a random password here
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: {
          id: params.id,
        },
        data: {
          password: hashedPassword,
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

      // Generate new password
      const newPassword = 'temp123'; // You can generate a random password here
      const hashedPassword = await hashPassword(newPassword);

      // Update password in MongoDB
      await db.collection('users').updateOne(
        { _id: new ObjectId(params.id) },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date(),
          } 
        }
      );
    }

    // Log password reset
    try {
      const auditLogger = createAuditLogger(user.id, user.serviceCenterId, request);
      await auditLogger.logPasswordChanged(existingUser.id || existingUser._id.toString());
    } catch (auditError) {
      console.warn('Audit logging failed:', auditError);
    }

    return createApiResponse({
      message: 'Пароль сброшен',
      newPassword: 'temp123', // In production, send this via email
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}
