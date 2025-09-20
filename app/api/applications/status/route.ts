import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, createErrorResponse, validateRequiredFields, validatePhone } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const validationError = validateRequiredFields(body, ['applicationNumber', 'phone']);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // Validate phone
    if (!validatePhone(body.phone)) {
      return createErrorResponse('Некорректный номер телефона', 400);
    }

    // Find application
    const application = await prisma.application.findFirst({
      where: {
        applicationNumber: body.applicationNumber,
        phone: body.phone,
      },
      include: {
        serviceCenter: {
          select: {
            number: true,
            address: true,
          },
        },
      },
    });

    if (!application) {
      return createErrorResponse('Заявка не найдена', 404);
    }

    return createApiResponse(application);
  } catch (error) {
    console.error('Error checking application status:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

