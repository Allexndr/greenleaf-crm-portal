import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing Greenleaf form filling...');
    
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
      headless: false, // Показываем браузер для отладки
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    try {
      // Переходим на сайт Greenleaf
      console.log('Navigating to Greenleaf Global...');
      await page.goto('https://greenleaf-global.com/', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Ждем загрузки
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Получаем заголовок страницы
      const title = await page.title();
      console.log('Page title:', title);

      // Делаем скриншот
      const screenshot = await page.screenshot({ 
        encoding: 'base64',
        fullPage: true 
      });

      // Проверяем наличие элементов
      const loginButton = await page.$('text=Вход');
      const hasLoginButton = !!loginButton;
      
      // Получаем URL
      const currentUrl = page.url();

      await browser.close();

      return createApiResponse({
        message: 'Тест подключения к Greenleaf Global успешен',
        title: title,
        currentUrl: currentUrl,
        hasLoginButton: hasLoginButton,
        screenshot: `data:image/png;base64,${screenshot}`,
        success: true
      });

    } catch (error) {
      await browser.close();
      throw error;
    }

  } catch (error) {
    console.error('Greenleaf test failed:', error);
    return createErrorResponse(`Ошибка тестирования Greenleaf: ${error.message}`, 500);
  }
}
