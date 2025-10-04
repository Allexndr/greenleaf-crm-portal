import puppeteer from 'puppeteer';

export interface GreenleafFormData {
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

export interface GreenleafFormResult {
  success: boolean;
  login?: string;
  password?: string;
  error?: string;
  screenshot?: string;
}

export class GreenleafFormFiller {
  private browser: any;
  private page: any;

  async initialize() {
    try {
      this.browser = await puppeteer.launch({
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

      this.page = await this.browser.newPage();
      
      // Устанавливаем размер окна
      await this.page.setViewport({ width: 1280, height: 720 });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      return false;
    }
  }

  async loginToGreenleaf(login: string, password: string): Promise<boolean> {
    try {
      console.log('Logging into Greenleaf Global...');
      
      // Переходим на сайт Greenleaf
      await this.page.goto('https://greenleaf-global.com/', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Ждем загрузки страницы
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Ищем кнопку входа
      const loginButton = await this.page.$('text=Вход');
      if (loginButton) {
        await loginButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Заполняем форму входа
      await this.page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 10000 });
      
      // Ищем поля для логина и пароля
      const loginInputs = await this.page.$$('input[type="text"], input[type="email"], input[type="password"]');
      
      if (loginInputs.length >= 2) {
        // Заполняем логин
        await loginInputs[0].type(login);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Заполняем пароль
        await loginInputs[1].type(password);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Ищем и нажимаем кнопку входа
        const submitButton = await this.page.$('button[type="submit"], input[type="submit"], button:has-text("Войти")');
        if (submitButton) {
          await submitButton.click();
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Проверяем успешность входа
      const currentUrl = this.page.url();
      console.log('Current URL after login:', currentUrl);
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  async fillRegistrationForm(formData: GreenleafFormData): Promise<GreenleafFormResult> {
    try {
      console.log('Starting form filling process...');

      // Переходим на страницу регистрации
      const registrationUrl = 'https://greenleaf-global.com/do.vshow#admin/basics/reguser';
      await this.page.goto(registrationUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Ждем загрузки формы
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log('Form loaded, starting to fill fields...');

      // Заполняем поля формы согласно структуре Greenleaf
      const fieldsToFill = [
        { selector: 'input[name*="sponsor"], input[placeholder*="спонсор"]', value: formData.sponsor },
        { selector: 'input[name*="service"], select[name*="service"]', value: formData.serviceCenterLogin },
        { selector: 'input[name*="lastname"], input[placeholder*="фамилия"]', value: formData.lastName },
        { selector: 'input[name*="firstname"], input[placeholder*="имя"]', value: formData.firstName },
        { selector: 'input[name*="passport"], input[placeholder*="паспорт"]', value: formData.idNumber },
        { selector: 'input[name*="email"], input[type="email"]', value: formData.email },
        { selector: 'input[name*="phone"], input[placeholder*="телефон"]', value: formData.phone },
        { selector: 'input[name*="placement"], input[placeholder*="размещение"]', value: formData.placement },
      ];

      for (const field of fieldsToFill) {
        try {
          const element = await this.page.$(field.selector);
          if (element) {
            await element.click();
            await element.clear();
            await element.type(field.value);
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log(`Filled field: ${field.selector} with value: ${field.value}`);
          }
        } catch (error) {
          console.warn(`Failed to fill field ${field.selector}:`, error);
        }
      }

      // Выбираем область размещения (радио-кнопки)
      const placementAreaMap = {
        'AUTO': 'Авто',
        'LEFT': 'Лево', 
        'RIGHT': 'Право'
      };

      const placementText = placementAreaMap[formData.placementArea];
      if (placementText) {
        try {
          const radioButton = await this.page.$(`input[value*="${placementText}"], label:has-text("${placementText}")`);
          if (radioButton) {
            await radioButton.click();
            console.log(`Selected placement area: ${placementText}`);
          }
        } catch (error) {
          console.warn('Failed to select placement area:', error);
        }
      }

      // Делаем скриншот заполненной формы
      const screenshot = await this.page.screenshot({ 
        encoding: 'base64',
        fullPage: true 
      });

      console.log('Form filled successfully, taking screenshot...');

      return {
        success: true,
        screenshot: `data:image/png;base64,${screenshot}`
      };

    } catch (error) {
      console.error('Form filling failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async clickNextButton(): Promise<boolean> {
    try {
      console.log('Looking for "Далее" button...');
      
      // Ищем кнопку "Далее"
      const nextButton = await this.page.$('button:has-text("Далее"), input[value*="Далее"], a:has-text("Далее")');
      
      if (nextButton) {
        await nextButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('Clicked "Далее" button successfully');
        return true;
      } else {
        console.log('Next button not found');
        return false;
      }
    } catch (error) {
      console.error('Failed to click next button:', error);
      return false;
    }
  }

  async getGeneratedLogin(): Promise<string | null> {
    try {
      // Ищем поле с сгенерированным логином
      const loginField = await this.page.$('input[name*="login"], input[readonly], input[disabled]');
      if (loginField) {
        const loginValue = await loginField.evaluate((el: any) => el.value);
        return loginValue || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get generated login:', error);
      return null;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async takeScreenshot(): Promise<string> {
    try {
      const screenshot = await this.page.screenshot({ 
        encoding: 'base64',
        fullPage: true 
      });
      return `data:image/png;base64,${screenshot}`;
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      return '';
    }
  }
}

// Функция для автоматического заполнения формы
export async function fillGreenleafForm(
  formData: GreenleafFormData,
  serviceCenterLogin: string = 's240350',
  serviceCenterPassword: string = '1982a'
): Promise<GreenleafFormResult> {
  const filler = new GreenleafFormFiller();
  
  try {
    // Инициализируем браузер
    const initialized = await filler.initialize();
    if (!initialized) {
      return { success: false, error: 'Failed to initialize browser' };
    }

    // Входим в систему
    const loggedIn = await filler.loginToGreenleaf(serviceCenterLogin, serviceCenterPassword);
    if (!loggedIn) {
      return { success: false, error: 'Failed to login to Greenleaf' };
    }

    // Заполняем форму
    const result = await filler.fillRegistrationForm(formData);
    
    if (result.success) {
      // Нажимаем кнопку "Далее"
      const nextClicked = await filler.clickNextButton();
      result.success = nextClicked;
      
      // Получаем сгенерированный логин
      const generatedLogin = await filler.getGeneratedLogin();
      if (generatedLogin) {
        result.login = generatedLogin;
      }
    }

    return result;

  } catch (error) {
    console.error('Greenleaf form filling process failed:', error);
    return { success: false, error: error.message };
  } finally {
    await filler.close();
  }
}
