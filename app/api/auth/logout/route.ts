import { NextRequest } from 'next/server';
import { createApiResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const response = createApiResponse({ message: 'Выход выполнен успешно' });
    
    // Clear cookie
    response.headers.set(
      'Set-Cookie',
      'auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
    );

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return createApiResponse({ message: 'Выход выполнен успешно' });
  }
}

