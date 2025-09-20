import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { ApplicationStatus, getStatusLabel, getPaymentMethodLabel, getPlacementAreaLabel } from '@/lib/types';
import { verifyToken } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const serviceCenterId = searchParams.get('serviceCenterId');
    const managerId = searchParams.get('managerId');
    const paymentMethod = searchParams.get('paymentMethod');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};

    // Filter by service center if user is not site admin
    if (user.role !== 'SITE_ADMIN' && user.serviceCenterId) {
      where.serviceCenterId = user.serviceCenterId;
    } else if (serviceCenterId) {
      where.serviceCenterId = serviceCenterId;
    }

    if (status) {
      where.status = status;
    }

    if (managerId) {
      where.managerId = managerId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (search) {
      where.OR = [
        { applicationNumber: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Get applications with related data
    const applications = await prisma.application.findMany({
      where,
      include: {
        serviceCenter: {
          select: {
            number: true,
            description: true,
            address: true,
          },
        },
        manager: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Prepare data for Excel
    const excelData = applications.map((app, index) => ({
      '№': index + 1,
      'ID заявки': app.applicationNumber,
      'Дата подачи': new Date(app.createdAt).toLocaleDateString('ru-RU'),
      'Время подачи': new Date(app.createdAt).toLocaleTimeString('ru-RU'),
      'Фамилия': app.lastName,
      'Имя': app.firstName,
      'Телефон': app.phone,
      'Email': app.email,
      'Спонсор': app.sponsor,
      'Размещение': app.placement,
      'Номер удостоверения': app.idNumber,
      'Область размещения': getPlacementAreaLabel(app.placementArea as any),
      'Способ оплаты': getPaymentMethodLabel(app.paymentMethod as any),
      'Статус': getStatusLabel(app.status),
      'Причина отклонения': app.rejectionReason || '',
      'Логин Greenleaf': app.greenleafLogin || '',
      'Пароль Greenleaf': app.greenleafPassword || '',
      'Сервисный центр': `${app.serviceCenter.number} - ${app.serviceCenter.description}`,
      'Адрес центра': app.serviceCenter.address,
      'Менеджер': app.manager?.email || '',
      'Дата обновления': new Date(app.updatedAt).toLocaleDateString('ru-RU'),
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 5 },   // №
      { wch: 15 },  // ID заявки
      { wch: 12 },  // Дата подачи
      { wch: 10 },  // Время подачи
      { wch: 15 },  // Фамилия
      { wch: 15 },  // Имя
      { wch: 15 },  // Телефон
      { wch: 25 },  // Email
      { wch: 15 },  // Спонсор
      { wch: 15 },  // Размещение
      { wch: 20 },  // Номер удостоверения
      { wch: 15 },  // Область размещения
      { wch: 15 },  // Способ оплаты
      { wch: 15 },  // Статус
      { wch: 30 },  // Причина отклонения
      { wch: 20 },  // Логин Greenleaf
      { wch: 20 },  // Пароль Greenleaf
      { wch: 30 },  // Сервисный центр
      { wch: 40 },  // Адрес центра
      { wch: 25 },  // Менеджер
      { wch: 12 },  // Дата обновления
    ];

    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Заявки');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create response
    const filename = `applications_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    return new Response(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return createErrorResponse('Ошибка при экспорте данных', 500);
  }
}

