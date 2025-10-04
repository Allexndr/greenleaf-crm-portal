import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { verifyToken } from '@/lib/auth';
import { getAuditLogger } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Only site admins can view audit logs
    if (user.role !== 'SITE_ADMIN') {
      return createErrorResponse('Доступ запрещен', 403);
    }

    const { searchParams } = new URL(request.url);
    const filters: any = {};

    // Parse query parameters
    const userId = searchParams.get('userId');
    const serviceCenterId = searchParams.get('serviceCenterId');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (userId) filters.userId = userId;
    if (serviceCenterId) filters.serviceCenterId = serviceCenterId;
    if (action) filters.action = action;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const auditLogger = getAuditLogger();
    const logs = await auditLogger.getLogs(filters);

    return createApiResponse({ logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}