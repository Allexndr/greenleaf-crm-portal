import { NextRequest } from 'next/server';
import { verifyToken } from './auth';
import { getCurrentUser } from './api-helpers';

export function getAuthenticatedUser(request: NextRequest) {
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
  
  return user;
}
