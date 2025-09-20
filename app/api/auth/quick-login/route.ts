import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { createApiResponse, createErrorResponse } from '@/lib/api-helpers';
import { generateToken, verifyPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Проверяем учетные данные
    if (!email || !password) {
      return createErrorResponse('Email и пароль обязательны', 400);
    }

    // Подключаемся к MongoDB
    const { db } = await connectToDatabase();

    // Ищем пользователя в MongoDB
    const user = await db.collection('users').findOne({
      email: email,
      isActive: true,
    });

    if (!user) {
      return createErrorResponse('Пользователь не найден', 401);
    }

    // Проверяем пароль
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return createErrorResponse('Неверный пароль', 401);
    }

    // Получаем информацию о сервисном центре если есть
    let serviceCenter = null;
    if (user.serviceCenterId) {
      serviceCenter = await db.collection('serviceCenters').findOne({
        _id: user.serviceCenterId,
      });
    }

    // Генерируем JWT токен
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role as any,
      serviceCenterId: user.serviceCenterId || undefined,
    });

    // Создаем ответ с токеном в cookie
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

    // Устанавливаем cookie
    response.headers.set(
      'Set-Cookie',
      `auth-token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=None; Secure=false`
    );

    return response;
  } catch (error) {
    console.error('Quick login error:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}
