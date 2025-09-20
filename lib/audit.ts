import { prisma } from './db';
import { UserRole } from './types';

export interface AuditLogData {
  userId: string;
  serviceCenterId?: string;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Создать запись аудита
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        serviceCenterId: data.serviceCenterId,
        action: data.action,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Получить IP адрес из запроса
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers?.get('x-forwarded-for');
  const realIP = request.headers?.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Получить User-Agent из запроса
 */
export function getUserAgent(request: Request): string {
  return request.headers?.get('user-agent') || 'unknown';
}

/**
 * Аудит действий пользователя
 */
export class AuditLogger {
  private userId: string;
  private serviceCenterId?: string;
  private ipAddress?: string;
  private userAgent?: string;

  constructor(userId: string, serviceCenterId?: string, ipAddress?: string, userAgent?: string) {
    this.userId = userId;
    this.serviceCenterId = serviceCenterId;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
  }

  /**
   * Логировать действие
   */
  async log(action: string, details?: any) {
    await createAuditLog({
      userId: this.userId,
      serviceCenterId: this.serviceCenterId,
      action,
      details,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
    });
  }

  /**
   * Логировать вход в систему
   */
  async logLogin(success: boolean, error?: string) {
    await this.log('LOGIN', {
      success,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Логировать выход из системы
   */
  async logLogout() {
    await this.log('LOGOUT', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Логировать создание сервисного центра
   */
  async logServiceCenterCreated(serviceCenterId: string, data: any) {
    await this.log('SERVICE_CENTER_CREATED', {
      serviceCenterId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Логировать обновление сервисного центра
   */
  async logServiceCenterUpdated(serviceCenterId: string, changes: any) {
    await this.log('SERVICE_CENTER_UPDATED', {
      serviceCenterId,
      changes,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Логировать удаление сервисного центра
   */
  async logServiceCenterDeleted(serviceCenterId: string) {
    await this.log('SERVICE_CENTER_DELETED', {
      serviceCenterId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Логировать создание пользователя
   */
  async logUserCreated(userId: string, userData: any) {
    await this.log('USER_CREATED', {
      userId,
      userData: {
        email: userData.email,
        role: userData.role,
        serviceCenterId: userData.serviceCenterId,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Логировать обновление пользователя
   */
  async logUserUpdated(userId: string, changes: any) {
    await this.log('USER_UPDATED', {
      userId,
      changes,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Логировать удаление пользователя
   */
  async logUserDeleted(userId: string) {
    await this.log('USER_DELETED', {
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Логировать изменение статуса заявки
   */
  async logApplicationStatusChanged(applicationId: string, oldStatus: string, newStatus: string, comment?: string) {
    await this.log('APPLICATION_STATUS_CHANGED', {
      applicationId,
      oldStatus,
      newStatus,
      comment,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Логировать экспорт данных
   */
  async logDataExport(type: string, filters: any, recordCount: number) {
    await this.log('DATA_EXPORT', {
      type,
      filters,
      recordCount,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Логировать изменение пароля
   */
  async logPasswordChanged(userId: string) {
    await this.log('PASSWORD_CHANGED', {
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Логировать ошибку
   */
  async logError(error: string, details?: any) {
    await this.log('ERROR', {
      error,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Создать логгер аудита для пользователя
 */
export function createAuditLogger(userId: string, serviceCenterId?: string, request?: Request): AuditLogger {
  const ipAddress = request ? getClientIP(request) : undefined;
  const userAgent = request ? getUserAgent(request) : undefined;
  
  return new AuditLogger(userId, serviceCenterId, ipAddress, userAgent);
}

/**
 * Получить статистику аудита
 */
export async function getAuditStats(serviceCenterId?: string, startDate?: Date, endDate?: Date) {
  const where: any = {};
  
  if (serviceCenterId) {
    where.serviceCenterId = serviceCenterId;
  }
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [totalLogs, actionCounts, recentLogs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
    }),
    prisma.auditLog.findMany({
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
      take: 50,
    }),
  ]);

  return {
    totalLogs,
    actionCounts,
    recentLogs,
  };
}

