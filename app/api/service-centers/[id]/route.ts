import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { connectToDatabase } from '@/lib/mongodb';
import { createApiResponse, createErrorResponse } from '@/lib/api-helpers';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let serviceCenter: any = null;

    try {
      // Try MongoDB first
      const { db } = await connectToDatabase();
      const mongoServiceCenter = await db.collection('serviceCenters').findOne({
        _id: new ObjectId(params.id),
        isActive: true,
      });

      if (mongoServiceCenter) {
        serviceCenter = {
          id: mongoServiceCenter._id.toString(),
          number: mongoServiceCenter.number,
          description: mongoServiceCenter.description,
          address: mongoServiceCenter.address,
        };
      }
    } catch (mongoError) {
      console.warn('MongoDB failed, trying Prisma:', mongoError);
      
      // Fallback to Prisma
      try {
        serviceCenter = await prisma.serviceCenter.findUnique({
          where: {
            id: params.id,
            isActive: true,
          },
          select: {
            id: true,
            number: true,
            description: true,
            address: true,
          },
        });
      } catch (prismaError) {
        console.error('Both MongoDB and Prisma failed:', prismaError);
        return createErrorResponse('Ошибка подключения к базе данных', 500);
      }
    }

    if (!serviceCenter) {
      return createErrorResponse('Сервисный центр не найден', 404);
    }

    return createApiResponse(serviceCenter);
  } catch (error) {
    console.error('Error fetching service center:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}

