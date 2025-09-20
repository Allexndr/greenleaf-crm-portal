import { NextRequest } from 'next/server';
import { UserRole } from './types';

export function getCurrentUser(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');
  const role = request.headers.get('x-user-role') as UserRole;
  const serviceCenterId = request.headers.get('x-service-center-id');

  if (!userId || !email || !role) {
    return null;
  }

  return {
    id: userId,
    email,
    role,
    serviceCenterId: serviceCenterId || undefined,
  };
}

export function createApiResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}

export function createErrorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

export function validateRequiredFields(data: any, fields: string[]): string | null {
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      return `Поле ${field} обязательно для заполнения`;
    }
  }
  return null;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.startsWith('8') && cleaned.length === 11;
}

