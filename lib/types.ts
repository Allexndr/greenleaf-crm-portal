export enum UserRole {
  SITE_ADMIN = 'SITE_ADMIN',
  SERVICE_CENTER_ADMIN = 'SERVICE_CENTER_ADMIN',
  MANAGER = 'MANAGER',
}

export enum ApplicationStatus {
  NEW = 'NEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
}

export enum PaymentMethod {
  KASPI = 'KASPI',
  CASH = 'CASH',
  OTHER_BANKS = 'OTHER_BANKS',
}

export enum PlacementArea {
  AUTO = 'AUTO',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

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
  role: UserRole;
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
  placementArea: PlacementArea;
  paymentMethod: PaymentMethod;
  paymentReceipt?: string;
  status: ApplicationStatus;
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
  status: ApplicationStatus;
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

export const getTrustColor = (paymentMethod: PaymentMethod): TrustColor => {
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

export const getStatusLabel = (status: ApplicationStatus): string => {
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

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
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

export const getPlacementAreaLabel = (area: PlacementArea): string => {
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

