import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, createErrorResponse, validateRequiredFields, validateEmail } from '@/lib/api-helpers';
import { verifyPassword, generateToken } from '@/lib/auth';
import { createAuditLogger, getClientIP, getUserAgent } from '@/lib/audit';

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

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
        isActive: true,
      },
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

    if (!user) {
      return createErrorResponse('Неверные учетные данные', 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(body.password, user.password);
    if (!isValidPassword) {
      // Log failed login attempt
      const auditLogger = createAuditLogger('unknown', undefined, request);
      await auditLogger.logLogin(false, 'Invalid password');
      
      return createErrorResponse('Неверные учетные данные', 401);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
      serviceCenterId: user.serviceCenterId || undefined,
    });

    // Log successful login
    const auditLogger = createAuditLogger(user.id, user.serviceCenterId || undefined, request);
    await auditLogger.logLogin(true);

    // Create response with token in cookie
    const response = createApiResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        serviceCenter: user.serviceCenter,
      },
    });

    // Set cookie
    response.headers.set(
      'Set-Cookie',
      `auth-token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=None; Secure=false`
    );

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}
