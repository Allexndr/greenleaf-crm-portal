import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { connectToDatabase } from '@/lib/mongodb';
import { createApiResponse, createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { verifyToken } from '@/lib/auth';
import { ApplicationStatus } from '@/lib/types';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Skip during build time
    if (process.env.NODE_ENV === 'production' && !request.headers.get('host')) {
      return createErrorResponse('Service unavailable during build', 503);
    }
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

    let application: any = null;

    try {
      // Try MongoDB first
      const { db } = await connectToDatabase();
      const mongoApplication = await db.collection('applications').findOne({
        _id: new ObjectId(params.id),
      });

      if (mongoApplication) {
        // Get service center info
        let serviceCenter = null;
        if (mongoApplication.serviceCenterId) {
          serviceCenter = await db.collection('serviceCenters').findOne({
            _id: mongoApplication.serviceCenterId,
          });
        }

        // Get manager info
        let manager = null;
        if (mongoApplication.managerId) {
          manager = await db.collection('users').findOne({
            _id: mongoApplication.managerId,
          });
        }

        // Get history
        const history = await db.collection('applicationHistory')
          .find({ applicationId: new ObjectId(params.id) })
          .sort({ createdAt: -1 })
          .toArray();

        application = {
          id: mongoApplication._id.toString(),
          applicationNumber: mongoApplication.applicationNumber,
          firstName: mongoApplication.firstName,
          lastName: mongoApplication.lastName,
          phone: mongoApplication.phone,
          email: mongoApplication.email,
          sponsor: mongoApplication.sponsor,
          placement: mongoApplication.placement,
          idNumber: mongoApplication.idNumber,
          placementArea: mongoApplication.placementArea,
          paymentMethod: mongoApplication.paymentMethod,
          status: mongoApplication.status,
          createdAt: mongoApplication.createdAt,
          updatedAt: mongoApplication.updatedAt,
          serviceCenter: serviceCenter ? {
            id: serviceCenter._id.toString(),
            number: serviceCenter.number,
            description: serviceCenter.description,
            address: serviceCenter.address,
          } : null,
          manager: manager ? {
            id: manager._id.toString(),
            email: manager.email,
          } : null,
          history: history.map(h => ({
            id: h._id.toString(),
            applicationId: h.applicationId.toString(),
            status: h.status,
            comment: h.comment,
            changedBy: h.changedBy,
            createdAt: h.createdAt,
          })),
        };
      }
    } catch (mongoError) {
      console.warn('MongoDB failed, trying Prisma:', mongoError);

      // Fallback to Prisma
      try {
        application = await prisma.application.findUnique({
          where: {
            id: params.id,
          },
          include: {
            serviceCenter: {
              select: {
                id: true,
                number: true,
                description: true,
                address: true,
              },
            },
            manager: {
              select: {
                id: true,
                email: true,
              },
            },
            history: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        });
      } catch (prismaError) {
        console.error('Both MongoDB and Prisma failed:', prismaError);
        return createErrorResponse('Ошибка подключения к базе данных', 500);
      }
    }

    if (!application) {
      return createErrorResponse('Заявка не найдена', 404);
    }

    // Check if user has access to this application
    if (user.role !== 'SITE_ADMIN' && user.serviceCenterId !== application.serviceCenterId) {
      return createErrorResponse('Доступ запрещен', 403);
    }

    return createApiResponse(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

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

    const body = await request.json();

    let application: any = null;

    try {
      // Try MongoDB first
      const { db } = await connectToDatabase();
      const mongoApplication = await db.collection('applications').findOne({
        _id: new ObjectId(params.id),
      });

      if (!mongoApplication) {
        return createErrorResponse('Заявка не найдена', 404);
      }

      // Check if user has access to this application
      if (user.role !== 'SITE_ADMIN' && user.serviceCenterId !== mongoApplication.serviceCenterId?.toString()) {
        return createErrorResponse('Доступ запрещен', 403);
      }

      // Update application
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (body.status) updateData.status = body.status;
      if (body.managerId) updateData.managerId = new ObjectId(body.managerId);
      if (body.comment) updateData.comment = body.comment;

      await db.collection('applications').updateOne(
        { _id: new ObjectId(params.id) },
        { $set: updateData }
      );

      // Add history entry
      await db.collection('applicationHistory').insertOne({
        applicationId: new ObjectId(params.id),
        status: body.status,
        comment: body.comment || 'Статус обновлен',
        changedBy: user.email,
        createdAt: new Date(),
      });

      // Get updated application
      const updatedMongoApplication = await db.collection('applications').findOne({
        _id: new ObjectId(params.id),
      });

      // Get service center and manager info
      let serviceCenter = null;
      if (updatedMongoApplication.serviceCenterId) {
        serviceCenter = await db.collection('serviceCenters').findOne({
          _id: updatedMongoApplication.serviceCenterId,
        });
      }

      let manager = null;
      if (updatedMongoApplication.managerId) {
        manager = await db.collection('users').findOne({
          _id: updatedMongoApplication.managerId,
        });
      }

      application = {
        id: updatedMongoApplication._id.toString(),
        applicationNumber: updatedMongoApplication.applicationNumber,
        firstName: updatedMongoApplication.firstName,
        lastName: updatedMongoApplication.lastName,
        phone: updatedMongoApplication.phone,
        email: updatedMongoApplication.email,
        sponsor: updatedMongoApplication.sponsor,
        placement: updatedMongoApplication.placement,
        idNumber: updatedMongoApplication.idNumber,
        placementArea: updatedMongoApplication.placementArea,
        paymentMethod: updatedMongoApplication.paymentMethod,
        status: updatedMongoApplication.status,
        createdAt: updatedMongoApplication.createdAt,
        updatedAt: updatedMongoApplication.updatedAt,
        serviceCenter: serviceCenter ? {
          id: serviceCenter._id.toString(),
          number: serviceCenter.number,
          description: serviceCenter.description,
          address: serviceCenter.address,
        } : null,
        manager: manager ? {
          id: manager._id.toString(),
          email: manager.email,
        } : null,
      };

    } catch (mongoError) {
      console.warn('MongoDB failed, trying Prisma:', mongoError);

      // Fallback to Prisma
      try {
        const prismaApplication = await prisma.application.findUnique({
          where: {
            id: params.id,
          },
        });

        if (!prismaApplication) {
          return createErrorResponse('Заявка не найдена', 404);
        }

        // Check if user has access to this application
        if (user.role !== 'SITE_ADMIN' && user.serviceCenterId !== prismaApplication.serviceCenterId) {
          return createErrorResponse('Доступ запрещен', 403);
        }

        // Update application
        application = await prisma.application.update({
          where: {
            id: params.id,
          },
          data: {
            status: body.status,
            managerId: body.managerId || null,
          },
          include: {
            serviceCenter: {
              select: {
                id: true,
                number: true,
                description: true,
                address: true,
              },
            },
            manager: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        });

        // Add history entry
        await prisma.applicationHistory.create({
          data: {
            applicationId: params.id,
            status: body.status,
            comment: body.comment || 'Статус обновлен',
            changedBy: user.email,
          },
        });
      } catch (prismaError) {
        console.error('Both MongoDB and Prisma failed:', prismaError);
        return createErrorResponse('Ошибка подключения к базе данных', 500);
      }
    }

    return createApiResponse(application);
  } catch (error) {
    console.error('Error updating application:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

