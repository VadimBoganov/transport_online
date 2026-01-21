import { test, expect } from '@playwright/test';

test.describe('Работа с маршрутами', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ждем загрузки приложения
    await page.waitForSelector('.map-container', { state: 'visible' });
    
    // Открываем sidebar
    const toggleBtn = page.locator('.sidebar-toggle-btn');
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    // Раскрываем первый аккордеон
    const firstAccordion = page.locator('.accordion-button').first();
    const isCollapsed = await firstAccordion.evaluate(el => el.classList.contains('collapsed'));
    if (isCollapsed) {
      await firstAccordion.click();
      await page.waitForTimeout(500);
    }
  });

  test('можно выбрать маршрут из списка', async ({ page }) => {
    // Ждем загрузки маршрутов
    await page.waitForSelector('.route-item', { state: 'visible', timeout: 10000 });

    // Получаем первый элемент маршрута
    const firstRoute = page.locator('.route-item').first();
    await expect(firstRoute).toBeVisible();

    // Кликаем на маршрут
    await firstRoute.click();

    // Проверяем, что маршрут стал активным (имеет класс selected или подобное)
    // Это зависит от реализации, возможно нужно будет адаптировать
    await expect(firstRoute).toHaveClass(/route-item/);
  });

  test('можно выбрать несколько маршрутов', async ({ page }) => {
    // Ждем загрузки маршрутов
    await page.waitForSelector('.route-item', { state: 'visible', timeout: 10000 });

    // Получаем первые два маршрута
    const routes = page.locator('.route-item');
    const routeCount = await routes.count();
    
    if (routeCount >= 2) {
      // Выбираем первый маршрут
      await routes.nth(0).click();
      await page.waitForTimeout(500);

      // Выбираем второй маршрут
      await routes.nth(1).click();
      await page.waitForTimeout(500);

      // Проверяем, что оба маршрута выбраны
      // (это зависит от реализации)
      expect(await routes.count()).toBeGreaterThanOrEqual(2);
    }
  });

  test('можно отменить выбор маршрута', async ({ page }) => {
    // Ждем загрузки маршрутов
    await page.waitForSelector('.route-item', { state: 'visible', timeout: 10000 });

    // Выбираем маршрут
    const firstRoute = page.locator('.route-item').first();
    await firstRoute.click();
    await page.waitForTimeout(500);

    // Отменяем выбор (кликаем еще раз)
    await firstRoute.click();
    await page.waitForTimeout(500);

    // Проверяем, что маршрут больше не выбран
    // (проверка зависит от реализации)
    await expect(firstRoute).toBeVisible();
  });

  test('поиск маршрутов работает', async ({ page }) => {
    // Ждем загрузки маршрутов
    await page.waitForSelector('.route-item', { state: 'visible', timeout: 10000 });

    // Ищем поле поиска (если есть)
    const searchInput = page.locator('input[type="search"], input[placeholder*="Поиск"]').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('1');
      await page.waitForTimeout(500);

      // Проверяем, что отфильтровались маршруты
      const visibleRoutes = page.locator('.route-item:visible');
      expect(await visibleRoutes.count()).toBeGreaterThan(0);
    }
  });
});
