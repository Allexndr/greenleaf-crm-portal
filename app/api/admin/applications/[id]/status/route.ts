import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { connectToDatabase } from '@/lib/mongodb';
import { createApiResponse, createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { verifyToken } from '@/lib/auth';
import { ApplicationStatus } from '@/lib/types';
import { generateGreenleafLogin } from '@/lib/utils';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function PATCH(
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
    const { status, comment, rejectionReason } = body;

    if (!Object.values(ApplicationStatus).includes(status)) {
      return createErrorResponse('Некорректный статус', 400);
    }

    let application: any = null;
    let serviceCenter: any = null;

    try {
      // Try MongoDB first
      const { db } = await connectToDatabase();

      // Get application
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

      // Get service center info
      if (mongoApplication.serviceCenterId) {
        serviceCenter = await db.collection('serviceCenters').findOne({
          _id: mongoApplication.serviceCenterId,
        });
      }

      // Prepare update data
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      // If approving, generate Greenleaf credentials
      if (status === ApplicationStatus.APPROVED) {
        updateData.greenleafLogin = generateGreenleafLogin();
        updateData.greenleafPassword = process.env.DEFAULT_TEMP_PASSWORD || 'Aa12345';
      }

      // If rejecting, save rejection reason
      if (status === ApplicationStatus.REJECTED && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      // If taking under review, assign to current user
      if (status === ApplicationStatus.UNDER_REVIEW) {
        updateData.managerId = new ObjectId(user.id);
      }

      // Update application
      await db.collection('applications').updateOne(
        { _id: new ObjectId(params.id) },
        { $set: updateData }
      );

      // Create history entry
      await db.collection('applicationHistory').insertOne({
        applicationId: new ObjectId(params.id),
        status,
        comment: comment || `Статус изменен на ${status}`,
        changedBy: user.email,
        createdAt: new Date(),
      });

      // If approved, try to create user in Greenleaf using form filling
      if (status === ApplicationStatus.APPROVED) {
        try {
          // Заполняем форму на сайте Greenleaf
          const { fillGreenleafForm } = await import('@/lib/greenleaf-form-filler');
          
          const formData = {
            sponsor: mongoApplication.sponsor,
            placement: mongoApplication.placement,
            firstName: mongoApplication.firstName,
            lastName: mongoApplication.lastName,
            idNumber: mongoApplication.idNumber,
            email: mongoApplication.email,
            phone: mongoApplication.phone,
            placementArea: mongoApplication.placementArea,
            serviceCenterLogin: 's240350',
            serviceCenterPassword: '1982a',
          };

          console.log('Filling Greenleaf form for approved application...');
          const greenleafResult = await fillGreenleafForm(formData);

          if (greenleafResult.success && greenleafResult.login) {
            // Update application with Greenleaf credentials
            await db.collection('applications').updateOne(
              { _id: new ObjectId(params.id) },
              {
                $set: {
                  greenleafLogin: greenleafResult.login,
                  greenleafPassword: process.env.DEFAULT_TEMP_PASSWORD || 'Aa12345',
                }
              }
            );
            
            console.log('Greenleaf form filled successfully, login generated:', greenleafResult.login);
          } else {
            // Mark as error if Greenleaf creation failed
            await db.collection('applications').updateOne(
              { _id: new ObjectId(params.id) },
              { $set: { status: ApplicationStatus.ERROR } }
            );

            await db.collection('applicationHistory').insertOne({
              applicationId: new ObjectId(params.id),
              status: ApplicationStatus.ERROR,
              comment: `Ошибка создания в Greenleaf: ${greenleafResult.error}`,
              changedBy: user.email,
              createdAt: new Date(),
            });
          }
        } catch (error: any) {
          console.error('Greenleaf integration error:', error);
          // Mark as error
          await db.collection('applications').updateOne(
            { _id: new ObjectId(params.id) },
            { $set: { status: ApplicationStatus.ERROR } }
          );
        }
      }

      // Get updated application
      const updatedApplication = await db.collection('applications').findOne({
        _id: new ObjectId(params.id),
      });

      application = updatedApplication;

    } catch (mongoError) {
      console.warn('MongoDB failed, trying Prisma:', mongoError);

      // Fallback to Prisma
      try {
        const prismaApplication = await prisma.application.findUnique({
          where: {
            id: params.id,
          },
          include: {
            serviceCenter: true,
          },
        });

        if (!prismaApplication) {
          return createErrorResponse('Заявка не найдена', 404);
        }

        // Check if user has access to this application
        if (user.role !== 'SITE_ADMIN' && user.serviceCenterId !== prismaApplication.serviceCenterId) {
          return createErrorResponse('Доступ запрещен', 403);
        }

        // Prepare update data
        const updateData: any = {
          status,
          updatedAt: new Date(),
        };

        // If approving, generate Greenleaf credentials
        if (status === ApplicationStatus.APPROVED) {
          updateData.greenleafLogin = generateGreenleafLogin();
          updateData.greenleafPassword = process.env.DEFAULT_TEMP_PASSWORD || 'Aa12345';
        }

        // If rejecting, save rejection reason
        if (status === ApplicationStatus.REJECTED && rejectionReason) {
          updateData.rejectionReason = rejectionReason;
        }

        // If taking under review, assign to current user
        if (status === ApplicationStatus.UNDER_REVIEW) {
          updateData.managerId = user.id;
        }

        // Update application
        const updatedApplication = await prisma.application.update({
          where: {
            id: params.id,
          },
          data: updateData,
        });

        // Create history entry
        await prisma.applicationHistory.create({
          data: {
            applicationId: params.id,
            status,
            comment: comment || `Статус изменен на ${status}`,
            changedBy: user.email,
          },
        });

        // If approved, try to create user in Greenleaf
        if (status === ApplicationStatus.APPROVED) {
          try {
            const { createGreenleafUser } = await import('@/lib/greenleaf-api');
            const greenleafResult = await createGreenleafUser(prismaApplication, prismaApplication.serviceCenter);

            if (greenleafResult.success && greenleafResult.login) {
              // Update application with Greenleaf credentials
              await prisma.application.update({
                where: { id: params.id },
                data: {
                  greenleafLogin: greenleafResult.login,
                  greenleafPassword: greenleafResult.password || process.env.DEFAULT_TEMP_PASSWORD || 'Aa12345',
                },
              });
            } else {
              // Mark as error if Greenleaf creation failed
              await prisma.application.update({
                where: { id: params.id },
                data: { status: ApplicationStatus.ERROR },
              });

              await prisma.applicationHistory.create({
                data: {
                  applicationId: params.id,
                  status: ApplicationStatus.ERROR,
                  comment: `Ошибка создания в Greenleaf: ${greenleafResult.error}`,
                  changedBy: user.email,
                },
              });
            }
          } catch (error: any) {
            console.error('Greenleaf integration error:', error);
            // Mark as error
            await prisma.application.update({
              where: { id: params.id },
              data: { status: ApplicationStatus.ERROR },
            });
          }
        }

        application = updatedApplication;
      } catch (prismaError) {
        console.error('Both MongoDB and Prisma failed:', prismaError);
        return createErrorResponse('Ошибка подключения к базе данных', 500);
      }
    }

    return createApiResponse({
      message: 'Статус заявки обновлен',
      application: application,
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}
