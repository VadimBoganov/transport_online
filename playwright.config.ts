import { defineConfig, devices } from '@playwright/test';

/**
 * Конфигурация Playwright для e2e тестов
 */
export default defineConfig({
  testDir: './src/tests/e2e',
  
  // Таймаут для каждого теста
  timeout: 30 * 1000,
  
  // Число попыток для упавших тестов
  retries: process.env.CI ? 2 : 0,
  
  // Число параллельных воркеров
  workers: process.env.CI ? 1 : undefined,
  
  // Репортеры
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }]
  ],
  
  // Общие настройки для всех проектов
  use: {
    // Базовый URL для тестов
    baseURL: 'http://localhost:5173',
    
    // Скриншоты только при падении теста
    screenshot: 'only-on-failure',
    
    // Видео только при падении теста
    video: 'retain-on-failure',
    
    // Трассировка при падении теста
    trace: 'on-first-retry',
  },

  // Настройка для запуска dev-сервера перед тестами
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Конфигурация проектов (браузеров)
  projects: [
    {
      name: 'chrome',
      use: { 
        ...devices['Desktop Chrome'],
        // Использовать установленный Google Chrome
        channel: 'chrome',
      },
    },

    // Можно раскомментировать для тестирования в других браузерах
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
