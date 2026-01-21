import { test, expect } from '@playwright/test';

test.describe('Основные функции приложения', () => {
  test('приложение загружается и отображает основные элементы', async ({ page }) => {
    await page.goto('/');

    // Проверяем, что страница загрузилась
    await expect(page).toHaveTitle(/transport_online/i);

    // Проверяем наличие сайдбара
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    // Проверяем наличие контейнера карты
    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toBeVisible();
  });

  test('сайдбар отображается и содержит маршруты', async ({ page }) => {
    await page.goto('/');

    // Открываем sidebar
    const toggleBtn = page.locator('.sidebar-toggle-btn');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await page.waitForTimeout(500);

    // Проверяем, что sidebar открыт
    const sidebar = page.locator('.sidebar.open');
    await expect(sidebar).toBeVisible();

    // Проверяем, что есть аккордеон с маршрутами
    const accordion = page.locator('.accordion');
    await expect(accordion).toBeVisible();
  });

  test('карта отображается и интерактивна', async ({ page }) => {
    await page.goto('/');

    // Проверяем наличие контейнера карты (pigeon-maps может не иметь прямого селектора)
    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toBeVisible();

    // Открываем sidebar
    const toggleBtn = page.locator('.sidebar-toggle-btn');
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    // Ждем загрузки аккордеона
    await page.waitForSelector('.accordion-button', { state: 'visible', timeout: 10000 });
    
    // Раскрываем первый аккордеон
    const firstAccordion = page.locator('.accordion-button').first();
    await firstAccordion.click();
    await page.waitForTimeout(500);
    
    // Ждем загрузки маршрутов
    await page.waitForSelector('.route-item', { state: 'visible', timeout: 10000 });
    
    // Выбираем первый маршрут
    const firstRoute = page.locator('.route-item').first();
    await firstRoute.click();
    await page.waitForTimeout(1000);

    // Проверяем, что canvas для транспорта создан
    const canvas = page.locator('canvas.vehicle-canvas');
    await expect(canvas).toBeVisible();
  });
});
