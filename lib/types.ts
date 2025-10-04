export const UserRole = {
  SITE_ADMIN: 'SITE_ADMIN',
  SERVICE_CENTER_ADMIN: 'SERVICE_CENTER_ADMIN',
  MANAGER: 'MANAGER',
} as const;

export const ApplicationStatus = {
  NEW: 'NEW',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ERROR: 'ERROR',
} as const;

export const PaymentMethod = {
  KASPI: 'KASPI',
  CASH: 'CASH',
  OTHER_BANKS: 'OTHER_BANKS',
} as const;

export const PlacementArea = {
  AUTO: 'AUTO',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
export type ApplicationStatus = typeof ApplicationStatus[keyof typeof ApplicationStatus];
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];
export type PlacementArea = typeof PlacementArea[keyof typeof PlacementArea];

export interface ServiceCenter {
  id: string;
  number: string;
  description: string;
  address: string;
  uniqueLink: string;
  greenleafLogin: string;
  greenleafPassword: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  role: string;
  serviceCenterId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  applicationNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  sponsor: string;
  placement: string;
  idNumber: string;
  placementArea: string;
  paymentMethod: string;
  paymentReceipt?: string;
  starterKit: string;
  status: string;
  rejectionReason?: string;
  greenleafLogin?: string;
  greenleafPassword?: string;
  serviceCenterId: string;
  managerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationHistory {
  id: string;
  applicationId: string;
  status: string;
  comment?: string;
  changedBy: string;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  serviceCenterId?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface TrustColor {
  color: 'green' | 'orange' | 'red';
  label: string;
}

export const getTrustColor = (paymentMethod: string): TrustColor => {
  switch (paymentMethod) {
    case PaymentMethod.KASPI:
      return { color: 'green', label: 'Каспи оплата' };
    case PaymentMethod.CASH:
      return { color: 'orange', label: 'Наличные' };
    case PaymentMethod.OTHER_BANKS:
      return { color: 'red', label: 'Остальные банки' };
    default:
      return { color: 'red', label: 'Неизвестно' };
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case ApplicationStatus.NEW:
      return 'Новая';
    case ApplicationStatus.UNDER_REVIEW:
      return 'На проверке';
    case ApplicationStatus.APPROVED:
      return 'Утверждена';
    case ApplicationStatus.REJECTED:
      return 'Отклонена';
    case ApplicationStatus.ERROR:
      return 'Ошибка';
    default:
      return 'Неизвестно';
  }
};

export const getPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case PaymentMethod.KASPI:
      return 'Каспи';
    case PaymentMethod.CASH:
      return 'Наличные';
    case PaymentMethod.OTHER_BANKS:
      return 'Другие банки';
    default:
      return 'Неизвестно';
  }
};

export const getPlacementAreaLabel = (area: string): string => {
  switch (area) {
    case PlacementArea.AUTO:
      return 'Авто';
    case PlacementArea.LEFT:
      return 'Лево';
    case PlacementArea.RIGHT:
      return 'Право';
    default:
      return 'Неизвестно';
  }
};

