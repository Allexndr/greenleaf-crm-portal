import { connectToDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

export interface AuditLogEntry {
  _id?: ObjectId;
  userId: string;
  userEmail: string;
  serviceCenterId?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export class AuditLogger {
  private static instance: AuditLogger;
  
  private constructor() {}
  
  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async log(
    userId: string,
    userEmail: string,
    action: string,
    details?: string,
    serviceCenterId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const { db } = await connectToDatabase();
      
      const logEntry: AuditLogEntry = {
        userId,
        userEmail,
      serviceCenterId,
        action,
        details,
        ipAddress,
        userAgent,
        createdAt: new Date(),
      };

      await db.collection('auditLogs').insertOne(logEntry);
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw error to avoid breaking the main functionality
    }
  }

  async getLogs(
    filters: {
      userId?: string;
      serviceCenterId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AuditLogEntry[]> {
    try {
      const { db } = await connectToDatabase();
      
      const query: any = {};
      
      if (filters.userId) {
        query.userId = filters.userId;
      }
      
      if (filters.serviceCenterId) {
        query.serviceCenterId = filters.serviceCenterId;
      }
      
      if (filters.action) {
        query.action = filters.action;
      }
      
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.createdAt.$lte = filters.endDate;
        }
      }

      const cursor = db.collection('auditLogs')
        .find(query)
        .sort({ createdAt: -1 });

      if (filters.limit) {
        cursor.limit(filters.limit);
      }
      
      if (filters.offset) {
        cursor.skip(filters.offset);
      }

      return await cursor.toArray();
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }
  }

  async exportLogs(filters: any = {}): Promise<any[]> {
    try {
      const logs = await this.getLogs(filters);
      
      return logs.map(log => ({
        Дата: log.createdAt.toLocaleDateString('ru-RU'),
        Время: log.createdAt.toLocaleTimeString('ru-RU'),
        Пользователь: log.userEmail,
        Действие: log.action,
        Детали: log.details || '',
        'Сервисный центр': log.serviceCenterId || '',
        IP: log.ipAddress || '',
      }));
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      return [];
    }
  }
}

// Predefined action types
export const AuditActions = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE_SERVICE_CENTER: 'CREATE_SERVICE_CENTER',
  UPDATE_SERVICE_CENTER: 'UPDATE_SERVICE_CENTER',
  DELETE_SERVICE_CENTER: 'DELETE_SERVICE_CENTER',
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  RESET_PASSWORD: 'RESET_PASSWORD',
  APPROVE_APPLICATION: 'APPROVE_APPLICATION',
  REJECT_APPLICATION: 'REJECT_APPLICATION',
  UPDATE_APPLICATION_STATUS: 'UPDATE_APPLICATION_STATUS',
  EXPORT_DATA: 'EXPORT_DATA',
  UPDATE_GREENLEAF_CREDENTIALS: 'UPDATE_GREENLEAF_CREDENTIALS',
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];

// Helper function to get audit logger instance
export const getAuditLogger = () => AuditLogger.getInstance();