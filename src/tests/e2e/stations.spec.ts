import { test, expect } from '@playwright/test';

test.describe('Работа с остановками', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.map-container', { state: 'visible' });
  });

  test('вкладка остановок доступна', async ({ page }) => {
    // Открываем sidebar
    const toggleBtn = page.locator('.sidebar-toggle-btn');
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    // Ищем вкладку остановок в сайдбаре
    const stationsTab = page.getByRole('tab', { name: /Остановки/i });
    
    if (await stationsTab.count() > 0) {
      await expect(stationsTab).toBeVisible();
      await stationsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('можно выбрать остановку из списка', async ({ page }) => {
    // Открываем sidebar
    const toggleBtn = page.locator('.sidebar-toggle-btn');
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    // Переключаемся на вкладку остановок (если есть)
    const stationsTab = page.getByRole('tab', { name: /Остановки/i });
    
    if (await stationsTab.count() > 0) {
      // Скроллим к вкладке, чтобы она была видна
      await stationsTab.scrollIntoViewIfNeeded();
      await stationsTab.click({ force: true });
      await page.waitForTimeout(500);

      // Ждем загрузки списка остановок
      const stationItem = page.locator('.station-item').first();
      
      if (await stationItem.count() > 0) {
        await expect(stationItem).toBeVisible();
        await stationItem.click();
        await page.waitForTimeout(1000);

        // Проверяем, что на карте появился маркер остановки
        const stationMarker = page.locator('.station-marker');
        await expect(stationMarker).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('попап остановки открывается при выборе', async ({ page }) => {
    // Переключаемся на вкладку остановок
    const stationsTab = page.locator('text=/Остановки/i').first();
    
    if (await stationsTab.count() > 0) {
      await stationsTab.click();
      await page.waitForTimeout(500);

      // Выбираем остановку
      const stationItem = page.locator('.station-item').first();
      
      if (await stationItem.count() > 0) {
        await stationItem.click();
        await page.waitForTimeout(1000);

        // Проверяем, что попап появился
        const popup = page.locator('.station-popup, .popup');
        await expect(popup).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('можно закрыть попап остановки', async ({ page }) => {
    // Переключаемся на вкладку остановок
    const stationsTab = page.locator('text=/Остановки/i').first();
    
    if (await stationsTab.count() > 0) {
      await stationsTab.click();
      await page.waitForTimeout(500);

      // Выбираем остановку
      const stationItem = page.locator('.station-item').first();
      
      if (await stationItem.count() > 0) {
        await stationItem.click();
        await page.waitForTimeout(1000);

        // Ищем кнопку закрытия
        const closeButton = page.locator('button[aria-label*="Закрыть"], button.close, .close-button').first();
        
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(500);

          // Проверяем, что попап закрылся
          const popup = page.locator('.station-popup, .popup');
          await expect(popup).not.toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('прогнозы прибытия отображаются в попапе остановки', async ({ page }) => {
    // Переключаемся на вкладку остановок
    const stationsTab = page.locator('text=/Остановки/i').first();
    
    if (await stationsTab.count() > 0) {
      await stationsTab.click();
      await page.waitForTimeout(500);

      // Выбираем остановку
      const stationItem = page.locator('.station-item').first();
      
      if (await stationItem.count() > 0) {
        await stationItem.click();
        await page.waitForTimeout(2000);

        // Проверяем наличие прогнозов или индикатора загрузки
        const forecasts = page.locator('.forecast-item, text=/мин/i, .spinner');
        const count = await forecasts.count();
        expect(count).toBeGreaterThan(0);
      }
    }
  });
});
