import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createErrorResponse, getCurrentUser } from '@/lib/api-helpers';
import { verifyToken } from '@/lib/auth';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

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
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const serviceCenterId = searchParams.get('serviceCenterId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    // Filter by service center if user is not site admin
    if (user.role !== 'SITE_ADMIN' && user.serviceCenterId) {
      where.serviceCenterId = user.serviceCenterId;
    } else if (serviceCenterId) {
      where.serviceCenterId = serviceCenterId;
    }

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { details: { contains: search } },
        { ipAddress: { contains: search } },
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

    // Get audit logs with related data
    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
        serviceCenter: {
          select: {
            number: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Prepare data for Excel
    const excelData = auditLogs.map((log, index) => ({
      '№': index + 1,
      'Дата': new Date(log.createdAt).toLocaleDateString('ru-RU'),
      'Время': new Date(log.createdAt).toLocaleTimeString('ru-RU'),
      'Действие': log.action,
      'Пользователь': log.user.email,
      'Роль': log.user.role,
      'Сервисный центр': log.serviceCenter ? `${log.serviceCenter.number} - ${log.serviceCenter.description}` : '',
      'IP адрес': log.ipAddress || '',
      'User Agent': log.userAgent || '',
      'Детали': log.details || '',
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 5 },   // №
      { wch: 12 },  // Дата
      { wch: 10 },  // Время
      { wch: 25 },  // Действие
      { wch: 25 },  // Пользователь
      { wch: 15 },  // Роль
      { wch: 30 },  // Сервисный центр
      { wch: 15 },  // IP адрес
      { wch: 50 },  // User Agent
      { wch: 100 }, // Детали
    ];

    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Аудит');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create response
    const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    return new Response(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Audit export error:', error);
    return createErrorResponse('Ошибка при экспорте аудита', 500);
  }
}

