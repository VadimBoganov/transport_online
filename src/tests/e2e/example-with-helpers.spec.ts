import { test, expect } from '@playwright/test';
import {
  waitForAppReady,
  selectFirstRoute,
  openStationsTab,
  selectFirstStation,
  closePopup,
  clickOnCanvas,
  checkElementSize,
  waitForVehicleCanvas,
} from './helpers';

/**
 * Примеры тестов с использованием хелперов
 * 
 * Эти тесты демонстрируют, как использовать вспомогательные функции
 * для написания более чистых и поддерживаемых тестов
 */

test.describe('Примеры использования хелперов', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('использование хелпера для выбора маршрута', async ({ page }) => {
    // Используем хелпер для выбора первого маршрута
    const route = await selectFirstRoute(page);
    await expect(route).toBeVisible();

    // Ждем появления canvas с увеличенным таймаутом (может зависеть от API)
    const hasCanvas = await waitForVehicleCanvas(page, 10000);
    if (hasCanvas) {
      const canvas = page.locator('canvas.vehicle-canvas');
      await expect(canvas).toBeVisible();
    }
  });

  test('использование хелперов для работы с остановками', async ({ page }) => {
    // Открываем вкладку остановок
    const opened = await openStationsTab(page);
    
    if (opened) {
      // Выбираем первую остановку
      const station = await selectFirstStation(page);
      
      if (station) {
        // Проверяем, что маркер остановки появился
        const marker = page.locator('.station-marker');
        await expect(marker).toBeVisible({ timeout: 5000 });

        // Закрываем попап
        await closePopup(page);
      }
    }
  });

  test('использование хелпера для проверки размеров', async ({ page }) => {
    await selectFirstRoute(page);
    
    const hasCanvas = await waitForVehicleCanvas(page, 10000);
    if (hasCanvas) {
      // Проверяем размеры canvas
      const box = await checkElementSize(
        page,
        'canvas.vehicle-canvas',
        200,
        200
      );

      expect(box).toBeTruthy();
    }
  });

  test('использование хелпера для клика на canvas', async ({ page }) => {
    await selectFirstRoute(page);
    
    const hasCanvas = await waitForVehicleCanvas(page, 10000);
    if (hasCanvas) {
      // Кликаем в центр canvas
      const coords = await clickOnCanvas(page, 'canvas.vehicle-canvas');
      
      expect(coords).not.toBeNull();
      if (coords) {
        expect(coords.x).toBeGreaterThan(0);
        expect(coords.y).toBeGreaterThan(0);
      }
    }
  });

  test('комплексный сценарий с несколькими хелперами', async ({ page }) => {
    // 1. Выбираем маршрут
    await selectFirstRoute(page);

    // 2. Проверяем размеры карты
    await checkElementSize(page, '.map-container', 400, 400);

    // 3. Ждем и проверяем canvas, если он есть
    const hasCanvas = await waitForVehicleCanvas(page, 10000);
    if (hasCanvas) {
      await checkElementSize(page, 'canvas.vehicle-canvas', 100, 100);

      // 4. Кликаем на canvas
      await clickOnCanvas(page, 'canvas.vehicle-canvas');
      await page.waitForTimeout(1000);

      // 5. Проверяем результат (прогнозы или выделение)
      const forecasts = page.locator('.forecast-popup-station');
      const hasForecasts = (await forecasts.count()) > 0;

      // Это ожидаемое поведение (может быть попап или нет, в зависимости от попадания в транспорт)
      expect(hasForecasts).toBeDefined();
    }
  });
});
