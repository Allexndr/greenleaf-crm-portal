import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { verifyToken } from '@/lib/auth';
import { ApplicationStatus, PaymentMethod, getStatusLabel, getPaymentMethodLabel, getPlacementAreaLabel } from '@/lib/types';
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
    const type = searchParams.get('type') || 'applications';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const serviceCenterId = searchParams.get('serviceCenterId');

    // Build where clause
    const where: any = {};

    // Filter by service center if user is not site admin
    if (user.role !== 'SITE_ADMIN' && user.serviceCenterId) {
      where.serviceCenterId = user.serviceCenterId;
    } else if (serviceCenterId) {
      where.serviceCenterId = serviceCenterId;
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

    let excelData: any[] = [];
    let filename = '';

    switch (type) {
      case 'applications':
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

        excelData = applications.map((app, index) => ({
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
        filename = `applications_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        break;

      case 'status':
        const statusData = await prisma.application.groupBy({
          by: ['status'],
          where,
          _count: {
            status: true,
          },
        });

        excelData = statusData.map((item, index) => ({
          '№': index + 1,
          'Статус': getStatusLabel(item.status),
          'Количество': item._count.status,
        }));
        filename = `status_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        break;

      case 'payment':
        const paymentData = await prisma.application.groupBy({
          by: ['paymentMethod'],
          where,
          _count: {
            paymentMethod: true,
          },
        });

        excelData = paymentData.map((item, index) => ({
          '№': index + 1,
          'Способ оплаты': getPaymentMethodLabel(item.paymentMethod as any),
          'Количество': item._count.paymentMethod,
        }));
        filename = `payment_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        break;

      case 'service-centers':
        const serviceCenters = await prisma.serviceCenter.findMany({
          include: {
            _count: {
              select: {
                applications: true,
                users: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        excelData = serviceCenters.map((sc, index) => ({
          '№': index + 1,
          'Номер': sc.number,
          'Описание': sc.description,
          'Адрес': sc.address,
          'Ссылка': sc.uniqueLink,
          'Заявок': sc._count.applications,
          'Пользователей': sc._count.users,
          'Статус': sc.isActive ? 'Активен' : 'Неактивен',
          'Дата создания': new Date(sc.createdAt).toLocaleDateString('ru-RU'),
          'Дата обновления': new Date(sc.updatedAt).toLocaleDateString('ru-RU'),
        }));
        filename = `service_centers_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        break;

      case 'managers':
        const managers = await prisma.user.findMany({
          where: {
            role: 'MANAGER',
          },
          include: {
            serviceCenter: {
              select: {
                number: true,
                description: true,
              },
            },
            _count: {
              select: {
                applications: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        excelData = managers.map((manager, index) => ({
          '№': index + 1,
          'Email': manager.email,
          'Сервисный центр': manager.serviceCenter ? `${manager.serviceCenter.number} - ${manager.serviceCenter.description}` : '-',
          'Заявок обработано': manager._count.applications,
          'Статус': manager.isActive ? 'Активен' : 'Неактивен',
          'Дата создания': new Date(manager.createdAt).toLocaleDateString('ru-RU'),
        }));
        filename = `managers_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        break;

      case 'monthly':
        const monthlyData = await prisma.$queryRaw`
          SELECT 
            strftime('%Y-%m', createdAt) as month,
            COUNT(*) as count
          FROM Application
          WHERE ${where.createdAt ? `createdAt >= '${startDate || '1900-01-01'}' AND createdAt <= '${endDate || '2100-12-31'}'` : '1=1'}
          ${user.role !== 'SITE_ADMIN' && user.serviceCenterId ? `AND serviceCenterId = '${user.serviceCenterId}'` : ''}
          GROUP BY strftime('%Y-%m', createdAt)
          ORDER BY month DESC
        ` as Array<{ month: string; count: number }>;

        excelData = monthlyData.map((item, index) => ({
          '№': index + 1,
          'Месяц': item.month,
          'Количество заявок': Number(item.count),
        }));
        filename = `monthly_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        break;

      default:
        return createErrorResponse('Неизвестный тип отчета', 400);
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = excelData.length > 0 ? 
      Object.keys(excelData[0]).map(() => ({ wch: 15 })) : 
      [{ wch: 15 }];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Отчет');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create response
    return new Response(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Report export error:', error);
    return createErrorResponse('Ошибка при экспорте отчета', 500);
  }
}
