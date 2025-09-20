import axios from 'axios';

const GREENLEAF_API_URL = process.env.GREENLEAF_API_URL || 'https://greenleaf-global.com/api';
const GREENLEAF_API_KEY = process.env.GREENLEAF_API_KEY;

export interface GreenleafUserData {
  sponsor: string;
  placement: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  email: string;
  phone: string;
  placementArea: 'AUTO' | 'LEFT' | 'RIGHT';
  serviceCenterLogin: string;
  serviceCenterPassword: string;
}

export interface GreenleafResponse {
  success: boolean;
  login?: string;
  password?: string;
  error?: string;
  message?: string;
}

class GreenleafAPI {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = GREENLEAF_API_KEY || '';
    this.baseURL = GREENLEAF_API_URL;
  }

  private async makeRequest(endpoint: string, data: any): Promise<GreenleafResponse> {
    try {
      const response = await axios.post(`${this.baseURL}${endpoint}`, data, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      });

      return {
        success: true,
        ...response.data,
      };
    } catch (error: any) {
      console.error('Greenleaf API Error:', error);
      
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || 'API Error',
          message: `HTTP ${error.response.status}: ${error.response.statusText}`,
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'Network Error',
          message: 'Не удалось подключиться к серверу Greenleaf',
        };
      } else {
        return {
          success: false,
          error: 'Unknown Error',
          message: error.message || 'Неизвестная ошибка',
        };
      }
    }
  }

  /**
   * Создание пользователя в системе Greenleaf
   */
  async createUser(userData: GreenleafUserData): Promise<GreenleafResponse> {
    const payload = {
      sponsor: userData.sponsor,
      placement: userData.placement,
      firstName: userData.firstName,
      lastName: userData.lastName,
      idNumber: userData.idNumber,
      email: userData.email,
      phone: userData.phone,
      placementArea: userData.placementArea,
      serviceCenterCredentials: {
        login: userData.serviceCenterLogin,
        password: userData.serviceCenterPassword,
      },
      // Дополнительные поля для Greenleaf
      passportSeries: userData.idNumber,
      passportNumber: userData.idNumber,
      tempPassword: process.env.DEFAULT_TEMP_PASSWORD || 'Aa12345',
    };

    return this.makeRequest('/users/create', payload);
  }

  /**
   * Проверка подключения к Greenleaf API
   */
  async testConnection(serviceCenterLogin: string, serviceCenterPassword: string): Promise<GreenleafResponse> {
    const payload = {
      login: serviceCenterLogin,
      password: serviceCenterPassword,
    };

    return this.makeRequest('/auth/test', payload);
  }

  /**
   * Получение информации о пользователе
   */
  async getUserInfo(login: string): Promise<GreenleafResponse> {
    return this.makeRequest('/users/info', { login });
  }

  /**
   * Обновление пароля пользователя
   */
  async updateUserPassword(login: string, newPassword: string): Promise<GreenleafResponse> {
    const payload = {
      login,
      newPassword,
    };

    return this.makeRequest('/users/update-password', payload);
  }

  /**
   * Создание заказа стартового набора
   */
  async createStarterKitOrder(userLogin: string, serviceCenterLogin: string): Promise<GreenleafResponse> {
    const payload = {
      userLogin,
      serviceCenterLogin,
      productCode: 'A003', // Стандартный стартовый набор
      quantity: 1,
    };

    return this.makeRequest('/orders/create-starter-kit', payload);
  }

  /**
   * Обработка платежа
   */
  async processPayment(orderId: string, paymentMethod: 'KASPI' | 'CASH' | 'OTHER_BANKS'): Promise<GreenleafResponse> {
    const payload = {
      orderId,
      paymentMethod,
      amount: 188000, // Стандартная цена стартового набора
    };

    return this.makeRequest('/payments/process', payload);
  }
}

export const greenleafAPI = new GreenleafAPI();

/**
 * Вспомогательная функция для создания пользователя в Greenleaf
 */
export async function createGreenleafUser(
  applicationData: any,
  serviceCenter: any
): Promise<{ success: boolean; login?: string; password?: string; error?: string }> {
  try {
    const userData: GreenleafUserData = {
      sponsor: applicationData.sponsor,
      placement: applicationData.placement,
      firstName: applicationData.firstName,
      lastName: applicationData.lastName,
      idNumber: applicationData.idNumber,
      email: applicationData.email,
      phone: applicationData.phone,
      placementArea: applicationData.placementArea,
      serviceCenterLogin: serviceCenter.greenleafLogin,
      serviceCenterPassword: serviceCenter.greenleafPassword,
    };

    const result = await greenleafAPI.createUser(userData);
    
    if (result.success) {
      // Создаем заказ стартового набора
      if (result.login) {
        const orderResult = await greenleafAPI.createStarterKitOrder(
          result.login,
          serviceCenter.greenleafLogin
        );
        
        if (orderResult.success) {
          // Обрабатываем платеж
          await greenleafAPI.processPayment(
            orderResult.orderId || '',
            applicationData.paymentMethod
          );
        }
      }
    }

    return result;
  } catch (error: any) {
    console.error('Error creating Greenleaf user:', error);
    return {
      success: false,
      error: error.message || 'Ошибка создания пользователя в Greenleaf',
    };
  }
}

