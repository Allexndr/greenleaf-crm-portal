import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { createApiResponse, createErrorResponse, validateRequiredFields, validateEmail } from '@/lib/api-helpers';
import { verifyPassword, generateToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const validationError = validateRequiredFields(body, ['email', 'password']);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // Validate email
    if (!validateEmail(body.email)) {
      return createErrorResponse('Некорректный email', 400);
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find user in MongoDB
    const user = await db.collection('users').findOne({
      email: body.email,
      isActive: true,
    });

    if (!user) {
      return createErrorResponse('Неверные учетные данные', 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(body.password, user.password);
    if (!isValidPassword) {
      return createErrorResponse('Неверные учетные данные', 401);
    }

    // Get service center info if exists
    let serviceCenter = null;
    if (user.serviceCenterId) {
      serviceCenter = await db.collection('serviceCenters').findOne({
        _id: user.serviceCenterId,
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      serviceCenterId: user.serviceCenterId || undefined,
    });

    // Create response with token in cookie
    const response = createApiResponse({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        serviceCenter: serviceCenter ? {
          id: serviceCenter._id.toString(),
          number: serviceCenter.number,
          description: serviceCenter.description,
        } : null,
      },
    });

    // Set cookie
    response.headers.set(
      'Set-Cookie',
      `auth-token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=None; Secure=false`
    );

    return response;
  } catch (error) {
    console.error('MongoDB login error:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}
