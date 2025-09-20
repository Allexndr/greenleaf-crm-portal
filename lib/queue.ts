import { prisma } from './db';
import { ApplicationStatus } from './types';
import { createGreenleafUser } from './greenleaf-api';

interface QueueJob {
  id: string;
  type: 'APPLICATION_PROCESSING' | 'GREENLEAF_SYNC' | 'NOTIFICATION';
  data: any;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledFor: Date;
}

class ApplicationQueue {
  private jobs: QueueJob[] = [];
  private isProcessing = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.startProcessing();
  }

  /**
   * Добавить задачу в очередь
   */
  addJob(job: Omit<QueueJob, 'id' | 'attempts' | 'createdAt'>) {
    const queueJob: QueueJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      attempts: 0,
      createdAt: new Date(),
      ...job,
    };

    this.jobs.push(queueJob);
    console.log(`Job added to queue: ${queueJob.type}`, queueJob.id);
  }

  /**
   * Запустить обработку очереди
   */
  startProcessing() {
    if (this.intervalId) {
      return;
    }

    const interval = parseInt(process.env.PROCESSING_INTERVAL || '30000');
    
    this.intervalId = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processJobs();
      }
    }, interval);

    console.log(`Queue processing started with ${interval}ms interval`);
  }

  /**
   * Остановить обработку очереди
   */
  stopProcessing() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Обработать задачи в очереди
   */
  private async processJobs() {
    if (this.isProcessing || this.jobs.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Получаем задачи, готовые к обработке
      const readyJobs = this.jobs.filter(
        job => job.scheduledFor <= new Date() && job.attempts < job.maxAttempts
      );

      for (const job of readyJobs) {
        try {
          await this.executeJob(job);
          // Удаляем успешно выполненную задачу
          this.jobs = this.jobs.filter(j => j.id !== job.id);
        } catch (error) {
          console.error(`Job ${job.id} failed:`, error);
          job.attempts++;
          
          if (job.attempts >= job.maxAttempts) {
            console.error(`Job ${job.id} exceeded max attempts, removing from queue`);
            this.jobs = this.jobs.filter(j => j.id !== job.id);
          } else {
            // Планируем повторную попытку через 5 минут
            job.scheduledFor = new Date(Date.now() + 5 * 60 * 1000);
          }
        }
      }
    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Выполнить конкретную задачу
   */
  private async executeJob(job: QueueJob) {
    console.log(`Executing job: ${job.type}`, job.id);

    switch (job.type) {
      case 'APPLICATION_PROCESSING':
        await this.processApplication(job.data);
        break;
      case 'GREENLEAF_SYNC':
        await this.syncWithGreenleaf(job.data);
        break;
      case 'NOTIFICATION':
        await this.sendNotification(job.data);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Обработать заявку
   */
  private async processApplication(data: { applicationId: string }) {
    const application = await prisma.application.findUnique({
      where: { id: data.applicationId },
      include: {
        serviceCenter: true,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Если заявка на рассмотрении более 24 часов, напоминаем менеджеру
    if (application.status === ApplicationStatus.UNDER_REVIEW) {
      const hoursSinceReview = (Date.now() - application.updatedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceReview >= 24) {
        // Добавляем задачу уведомления
        this.addJob({
          type: 'NOTIFICATION',
          data: {
            type: 'REVIEW_REMINDER',
            applicationId: application.id,
            managerId: application.managerId,
          },
          maxAttempts: 3,
          scheduledFor: new Date(),
        });
      }
    }
  }

  /**
   * Синхронизация с Greenleaf
   */
  private async syncWithGreenleaf(data: { applicationId: string }) {
    const application = await prisma.application.findUnique({
      where: { id: data.applicationId },
      include: {
        serviceCenter: true,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Если заявка утверждена, но нет данных Greenleaf, создаем пользователя
    if (application.status === ApplicationStatus.APPROVED && !application.greenleafLogin) {
      const result = await createGreenleafUser(application, application.serviceCenter);
      
      if (result.success && result.login) {
        await prisma.application.update({
          where: { id: application.id },
          data: {
            greenleafLogin: result.login,
            greenleafPassword: result.password || process.env.DEFAULT_TEMP_PASSWORD || 'Aa12345',
          },
        });
      } else {
        // Помечаем как ошибку
        await prisma.application.update({
          where: { id: application.id },
          data: { status: ApplicationStatus.ERROR },
        });
      }
    }
  }

  /**
   * Отправить уведомление
   */
  private async sendNotification(data: { type: string; applicationId: string; managerId?: string }) {
    // Здесь можно интегрировать с email/SMS сервисами
    console.log(`Sending notification: ${data.type} for application ${data.applicationId}`);
    
    // Пока просто логируем
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'NOTIFICATION_SENT',
        details: JSON.stringify(data),
      },
    });
  }

  /**
   * Получить статистику очереди
   */
  getStats() {
    return {
      totalJobs: this.jobs.length,
      pendingJobs: this.jobs.filter(j => j.scheduledFor > new Date()).length,
      readyJobs: this.jobs.filter(j => j.scheduledFor <= new Date()).length,
      failedJobs: this.jobs.filter(j => j.attempts >= j.maxAttempts).length,
      isProcessing: this.isProcessing,
    };
  }
}

// Создаем глобальный экземпляр очереди
export const applicationQueue = new ApplicationQueue();

/**
 * Добавить заявку в очередь обработки
 */
export function addApplicationToQueue(applicationId: string) {
  applicationQueue.addJob({
    type: 'APPLICATION_PROCESSING',
    data: { applicationId },
    maxAttempts: 3,
    scheduledFor: new Date(),
  });
}

/**
 * Добавить задачу синхронизации с Greenleaf
 */
export function addGreenleafSyncJob(applicationId: string) {
  applicationQueue.addJob({
    type: 'GREENLEAF_SYNC',
    data: { applicationId },
    maxAttempts: 5,
    scheduledFor: new Date(),
  });
}

/**
 * Добавить задачу уведомления
 */
export function addNotificationJob(data: any) {
  applicationQueue.addJob({
    type: 'NOTIFICATION',
    data,
    maxAttempts: 3,
    scheduledFor: new Date(),
  });
}

