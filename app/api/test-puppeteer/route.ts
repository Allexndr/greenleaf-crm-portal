import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Puppeteer...');
    
    // Простой тест puppeteer
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
      headless: true,
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
    
    // Переходим на простую страницу
    await page.goto('https://example.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });

    // Ждем загрузки
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Получаем заголовок страницы
    const title = await page.title();
    
    // Получаем текст страницы
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    await browser.close();

    return createApiResponse({
      message: 'Puppeteer работает корректно',
      title: title,
      bodyPreview: bodyText.substring(0, 100),
      success: true
    });

  } catch (error) {
    console.error('Puppeteer test failed:', error);
    return createErrorResponse(`Ошибка тестирования Puppeteer: ${error.message}`, 500);
  }
}
