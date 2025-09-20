import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { ApplicationStatus } from '@/lib/types';
import { generateGreenleafLogin } from '@/lib/utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return createErrorResponse('Не авторизован', 401);
    }

    const body = await request.json();
    const { status, comment, rejectionReason } = body;

    if (!Object.values(ApplicationStatus).includes(status)) {
      return createErrorResponse('Некорректный статус', 400);
    }

    // Get application
    const application = await prisma.application.findUnique({
      where: {
        id: params.id,
      },
      include: {
        serviceCenter: true,
      },
    });

    if (!application) {
      return createErrorResponse('Заявка не найдена', 404);
    }

    // Check if user has access to this application
    if (user.role !== 'SITE_ADMIN' && user.serviceCenterId !== application.serviceCenterId) {
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
        const greenleafResult = await createGreenleafUser(application, application.serviceCenter);
        
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

    return createApiResponse({
      message: 'Статус заявки обновлен',
      application: updatedApplication,
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}
