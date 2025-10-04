import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api-helpers';
import { fillGreenleafForm, GreenleafFormData } from '@/lib/greenleaf-form-filler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Валидация обязательных полей
    const requiredFields = [
      'firstName', 'lastName', 'phone', 'email', 'sponsor', 
      'placement', 'idNumber', 'placementArea'
    ];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse(`Поле ${field} обязательно`, 400);
      }
    }

    // Подготавливаем данные для формы Greenleaf
    const formData: GreenleafFormData = {
      sponsor: body.sponsor,
      placement: body.placement,
      firstName: body.firstName,
      lastName: body.lastName,
      idNumber: body.idNumber,
      email: body.email,
      phone: body.phone,
      placementArea: body.placementArea,
      serviceCenterLogin: body.serviceCenterLogin || 's240350',
      serviceCenterPassword: body.serviceCenterPassword || '1982a',
    };

    console.log('Starting Greenleaf form filling process...');
    
    // Запускаем процесс заполнения формы
    const result = await fillGreenleafForm(
      formData,
      formData.serviceCenterLogin,
      formData.serviceCenterPassword
    );

    if (result.success) {
      console.log('Greenleaf form filled successfully');
      return createApiResponse({
        message: 'Форма успешно заполнена на сайте Greenleaf',
        login: result.login,
        screenshot: result.screenshot,
        success: true
      });
    } else {
      console.error('Greenleaf form filling failed:', result.error);
      return createErrorResponse(
        `Ошибка заполнения формы: ${result.error}`,
        500
      );
    }

  } catch (error) {
    console.error('Error in Greenleaf form filling API:', error);
    return createErrorResponse('Внутренняя ошибка сервера', 500);
  }
}
