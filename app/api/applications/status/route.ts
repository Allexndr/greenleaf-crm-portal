import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { connectToDatabase } from '@/lib/mongodb';
import { createApiResponse, createErrorResponse, validateRequiredFields, validatePhone } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

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

    let application: any = null;

    try {
      // Try MongoDB first
      const { db } = await connectToDatabase();
      
      // Find application in MongoDB
      const mongoApplication = await db.collection('applications').findOne({
        applicationNumber: body.applicationNumber,
        phone: body.phone,
      });

      if (mongoApplication) {
        // Get service center info
        let serviceCenter = null;
        if (mongoApplication.serviceCenterId) {
          serviceCenter = await db.collection('serviceCenters').findOne({
            _id: mongoApplication.serviceCenterId,
          });
        }

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
            number: serviceCenter.number,
            address: serviceCenter.address,
          } : null,
        };
      }
    } catch (mongoError) {
      console.warn('MongoDB failed, trying Prisma:', mongoError);
      
      // Fallback to Prisma
      try {
        application = await prisma.application.findFirst({
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
      } catch (prismaError) {
        console.error('Both MongoDB and Prisma failed:', prismaError);
        return createErrorResponse('Ошибка подключения к базе данных', 500);
      }
    }

    if (!application) {
      return createErrorResponse('Заявка не найдена', 404);
    }

    return createApiResponse(application);
  } catch (error) {
    console.error('Error checking application status:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

