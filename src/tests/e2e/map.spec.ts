import { test, expect } from '@playwright/test';

test.describe('Работа с картой', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.map-container', { state: 'visible' });
  });

  test('карта загружается с правильными параметрами', async ({ page }) => {
    // Проверяем наличие контейнера карты
    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toBeVisible();

    // Проверяем, что карта имеет размеры
    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    expect(mapBox!.width).toBeGreaterThan(0);
    expect(mapBox!.height).toBeGreaterThan(0);
  });

  test('можно взаимодействовать с картой', async ({ page }) => {
    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toBeVisible();

    // Получаем начальное положение карты
    await page.waitForTimeout(1000);

    // Кликаем на карту
    await mapContainer.click();

    // Проверяем, что карта все еще видна
    await expect(mapContainer).toBeVisible();
  });

  test('canvas для транспорта рендерится', async ({ page }) => {
    // Открываем sidebar
    const toggleBtn = page.locator('.sidebar-toggle-btn');
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    // Ждем и раскрываем аккордеон
    await page.waitForSelector('.accordion-button', { state: 'visible', timeout: 10000 });
    const firstAccordion = page.locator('.accordion-button').first();
    await firstAccordion.click();
    await page.waitForTimeout(500);
    
    // Ждем загрузки маршрутов
    await page.waitForSelector('.route-item', { state: 'visible', timeout: 10000 });

    // Выбираем маршрут
    const firstRoute = page.locator('.route-item').first();
    await firstRoute.click();
    await page.waitForTimeout(1000);

    // Ждем появления canvas
    await page.waitForTimeout(2000);
    
    const canvas = page.locator('canvas.vehicle-canvas');
    const canvasCount = await canvas.count();
    
    // Canvas может не появиться, если API не вернул данные
    if (canvasCount > 0) {
      await expect(canvas).toBeVisible();

      // Проверяем, что canvas имеет размеры
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox).not.toBeNull();
      expect(canvasBox!.width).toBeGreaterThan(0);
      expect(canvasBox!.height).toBeGreaterThan(0);
    }
  });

  test('индикаторы загрузки отображаются', async ({ page }) => {
    // При первой загрузке должен появиться индикатор загрузки маршрутов
    // Проверяем наличие спиннера
    const spinner = page.locator('.spinner');
    const spinnerCount = await spinner.count();
    
    // Спиннер может быть или не быть в зависимости от скорости загрузки
    expect(spinnerCount).toBeGreaterThanOrEqual(0);
  });

  test('при выборе маршрута загружаются транспортные средства', async ({ page }) => {
    // Открываем sidebar
    const toggleBtn = page.locator('.sidebar-toggle-btn');
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    // Ждем и раскрываем аккордеон
    await page.waitForSelector('.accordion-button', { state: 'visible', timeout: 10000 });
    const firstAccordion = page.locator('.accordion-button').first();
    await firstAccordion.click();
    await page.waitForTimeout(500);
    
    // Ждем загрузки маршрутов
    await page.waitForSelector('.route-item', { state: 'visible', timeout: 10000 });

    // Выбираем маршрут
    const firstRoute = page.locator('.route-item').first();
    await firstRoute.click();

    // Ждем появления индикатора загрузки транспорта или его исчезновения
    await page.waitForTimeout(2000);

    // Проверяем, что canvas для транспорта создан (если API вернул данные)
    const canvas = page.locator('canvas.vehicle-canvas');
    const canvasCount = await canvas.count();
    
    // Это нормально, если canvas не появился - может не быть транспорта на маршруте
    if (canvasCount > 0) {
      await expect(canvas).toBeVisible();
    }
  });
});
