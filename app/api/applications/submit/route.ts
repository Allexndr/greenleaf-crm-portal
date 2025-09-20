import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, createErrorResponse, validateRequiredFields, validateEmail, validatePhone } from '@/lib/api-helpers';
import { generateApplicationNumber } from '@/lib/utils';
import { ApplicationStatus, PaymentMethod, PlacementArea } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'phone', 'email', 'sponsor', 
      'placement', 'idNumber', 'placementArea', 'paymentMethod', 'serviceCenterId'
    ];
    
    const validationError = validateRequiredFields(body, requiredFields);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // Validate email and phone
    if (!validateEmail(body.email)) {
      return createErrorResponse('Некорректный email', 400);
    }

    if (!validatePhone(body.phone)) {
      return createErrorResponse('Некорректный номер телефона', 400);
    }

    // Validate enums
    if (!Object.values(PaymentMethod).includes(body.paymentMethod)) {
      return createErrorResponse('Некорректный способ оплаты', 400);
    }

    if (!Object.values(PlacementArea).includes(body.placementArea)) {
      return createErrorResponse('Некорректная область размещения', 400);
    }

    // Check if service center exists
    const serviceCenter = await prisma.serviceCenter.findUnique({
      where: {
        id: body.serviceCenterId,
        isActive: true,
      },
    });

    if (!serviceCenter) {
      return createErrorResponse('Сервисный центр не найден', 404);
    }

    // Generate application number
    const applicationNumber = generateApplicationNumber();

    // Create application
    const application = await prisma.application.create({
      data: {
        applicationNumber,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email,
        sponsor: body.sponsor,
        placement: body.placement,
        idNumber: body.idNumber,
        placementArea: body.placementArea,
        paymentMethod: body.paymentMethod,
        paymentReceipt: body.paymentReceipt || null,
        status: ApplicationStatus.NEW,
        serviceCenterId: body.serviceCenterId,
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

    // Create initial history entry
    await prisma.applicationHistory.create({
      data: {
        applicationId: application.id,
        status: ApplicationStatus.NEW,
        comment: 'Заявка создана',
        changedBy: 'system',
      },
    });

    return createApiResponse({
      applicationNumber: application.applicationNumber,
      message: 'Заявка успешно подана',
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

