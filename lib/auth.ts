import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserRole } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  serviceCenterId?: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.MANAGER]: 0,
    [UserRole.SERVICE_CENTER_ADMIN]: 1,
    [UserRole.SITE_ADMIN]: 2,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canAccessServiceCenter(
  userRole: UserRole,
  userServiceCenterId: string | undefined,
  targetServiceCenterId: string
): boolean {
  // Site admin can access all service centers
  if (userRole === UserRole.SITE_ADMIN) {
    return true;
  }

  // Service center admin and manager can only access their own service center
  return userServiceCenterId === targetServiceCenterId;
}

