import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Хелперы для e2e тестов
 */

/**
 * Открытие sidebar (если он закрыт)
 */
export async function openSidebar(page: Page) {
  const toggleBtn = page.locator('.sidebar-toggle-btn');
  await expect(toggleBtn).toBeVisible();
  
  // Проверяем, открыт ли sidebar
  const sidebar = page.locator('.sidebar');
  const isOpen = await sidebar.evaluate(el => el.classList.contains('open'));
  
  if (!isOpen) {
    await toggleBtn.click();
    await page.waitForTimeout(500); // Ждем анимацию
  }
}

/**
 * Раскрытие первого аккордеона с маршрутами
 */
export async function openFirstAccordion(page: Page) {
  // Находим первый аккордеон
  const firstAccordionButton = page.locator('.accordion-button').first();
  
  // Проверяем, не раскрыт ли уже через accordion-collapse
  const accordionCollapse = page.locator('.accordion-collapse').first();
  const isOpen = await accordionCollapse.evaluate(el => 
    el.classList.contains('show')
  );
  
  if (!isOpen) {
    await firstAccordionButton.click();
    await page.waitForTimeout(500); // Ждем анимацию аккордеона
    
    // Дополнительно ждем появления класса 'show'
    await page.waitForSelector('.accordion-collapse.show', { state: 'visible', timeout: 2000 });
  }
}

/**
 * Ожидание загрузки приложения
 */
export async function waitForAppReady(page: Page) {
  await page.waitForSelector('.map-container', { state: 'visible' });
  await page.waitForSelector('.sidebar-toggle-btn', { state: 'visible' });
}

/**
 * Ожидание загрузки маршрутов
 * Полный путь: .sidebar.open > .tab-content > .accordion > .accordion-collapse.show > .routes-grid > .route-item
 */
export async function waitForRoutesLoaded(page: Page, timeout = 10000) {
  // 1. Открываем sidebar
  await openSidebar(page);
  
  // 2. Ждем появления вкладки "Маршруты" (должна быть активной)
  await page.waitForSelector('#sidebar-tabs-tabpane-routes.active', { state: 'visible', timeout: 5000 });
  
  // 3. Ждем появления аккордеона
  await page.waitForSelector('.accordion-button', { state: 'visible', timeout: 5000 });
  
  // 4. Раскрываем первый аккордеон
  await openFirstAccordion(page);
  
  // 5. Ждем появления routes-grid с маршрутами
  await page.waitForSelector('.routes-grid .route-item', { state: 'visible', timeout });
}

/**
 * Ожидание появления canvas для транспорта
 */
export async function waitForVehicleCanvas(page: Page, timeout = 5000) {
  try {
    await page.waitForSelector('canvas.vehicle-canvas', { state: 'attached', timeout });
    // Дополнительно ждем, чтобы canvas успел отрендериться
    await page.waitForTimeout(500);
    return true;
  } catch {
    return false;
  }
}

/**
 * Выбор первого маршрута из списка
 */
export async function selectFirstRoute(page: Page) {
  await waitForRoutesLoaded(page);
  
  // Кликаем на первый route-item (чекбокс внутри)
  const firstRoute = page.locator('.route-item').first();
  await firstRoute.click();
  await page.waitForTimeout(1000);
  return firstRoute;
}

/**
 * Выбор маршрута по индексу
 */
export async function selectRouteByIndex(page: Page, index: number) {
  await waitForRoutesLoaded(page);
  const route = page.locator('.route-item').nth(index);
  await route.click();
  await page.waitForTimeout(1000);
  return route;
}

/**
 * Открытие вкладки остановок
 */
export async function openStationsTab(page: Page) {
  // Сначала открываем sidebar
  await openSidebar(page);
  
  const stationsTab = page.getByRole('tab', { name: /Остановки/i });
  if (await stationsTab.count() > 0) {
    await stationsTab.scrollIntoViewIfNeeded();
    await stationsTab.click({ force: true });
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

/**
 * Выбор первой остановки из списка
 */
export async function selectFirstStation(page: Page) {
  const stationItem = page.locator('.station-item').first();
  if (await stationItem.count() > 0) {
    await stationItem.click();
    await page.waitForTimeout(1000);
    return stationItem;
  }
  return null;
}

/**
 * Закрытие попапа (общая функция)
 */
export async function closePopup(page: Page) {
  const closeButton = page.locator('button[aria-label*="Закрыть"], button.close, .close-button').first();
  if (await closeButton.count() > 0) {
    await closeButton.click();
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

/**
 * Проверка наличия индикатора загрузки
 */
export async function hasLoadingIndicator(page: Page): Promise<boolean> {
  const loadingIndicator = page.locator('.spinner, text=/Загрузка/i');
  return (await loadingIndicator.count()) > 0;
}

/**
 * Ожидание исчезновения индикатора загрузки
 */
export async function waitForLoadingToFinish(page: Page, timeout = 10000) {
  try {
    await page.waitForSelector('.spinner', { state: 'hidden', timeout });
  } catch {
    // Индикатора может не быть, это нормально
  }
}

/**
 * Клик по canvas в определенной точке
 */
export async function clickOnCanvas(page: Page, selector: string, offsetX = 0.5, offsetY = 0.5) {
  const canvas = page.locator(selector);
  await expect(canvas).toBeVisible();
  
  const canvasBox = await canvas.boundingBox();
  if (canvasBox) {
    const x = canvasBox.x + canvasBox.width * offsetX;
    const y = canvasBox.y + canvasBox.height * offsetY;
    await page.mouse.click(x, y);
    return { x, y };
  }
  return null;
}

/**
 * Получение количества видимых элементов по селектору
 */
export async function getVisibleCount(page: Page, selector: string): Promise<number> {
  const elements = page.locator(selector);
  return await elements.count();
}

/**
 * Проверка наличия текста на странице
 */
export async function hasText(page: Page, text: string | RegExp): Promise<boolean> {
  const element = page.locator(`text=${text}`);
  return (await element.count()) > 0;
}

/**
 * Ввод текста в поле поиска
 */
export async function searchFor(page: Page, text: string) {
  const searchInput = page.locator('input[type="search"], input[placeholder*="Поиск"]').first();
  if (await searchInput.count() > 0) {
    await searchInput.fill(text);
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

/**
 * Проверка размеров элемента
 */
export async function checkElementSize(page: Page, selector: string, minWidth = 100, minHeight = 100) {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  
  const box = await element.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(minWidth);
  expect(box!.height).toBeGreaterThanOrEqual(minHeight);
  
  return box;
}

/**
 * Ожидание появления элемента с текстом
 */
export async function waitForTextToAppear(page: Page, text: string | RegExp, timeout = 5000) {
  await page.waitForSelector(`text=${text}`, { state: 'visible', timeout });
}

/**
 * Скриншот элемента
 */
export async function screenshotElement(page: Page, selector: string, path: string) {
  const element = page.locator(selector);
  await element.screenshot({ path });
}

/**
 * Проверка, что элемент находится во viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  return await element.isVisible();
}

/**
 * Скролл к элементу
 */
export async function scrollToElement(page: Page, selector: string) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
}
