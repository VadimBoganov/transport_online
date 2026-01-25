import { test, expect } from '@playwright/test';

/**
 * Тесты для проверки обработки ошибок авторизации
 * Имитируют запросы браузера к API без токена или с невалидным токеном
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';

test.describe('Ошибки авторизации API', () => {
  test('Запрос к API без токена авторизации должен вернуть ошибку 401', async ({ page }) => {
    let requestFailed = false;
    let responseStatus = 0;
    let responseBody = '';

    // Перехватываем запросы к API
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/') && !url.includes('/auth/token')) {
        if (response.status() === 401) {
          requestFailed = true;
          responseStatus = response.status();
          responseBody = await response.text().catch(() => '');
        }
      }
    });

    // Перехватываем ошибки запросов
    page.on('requestfailed', (request) => {
      const url = request.url();
      if (url.includes('/api/') && !url.includes('/auth/token')) {
        requestFailed = true;
      }
    });

    // Загружаем страницу
    await page.goto('/');

    // Делаем запрос к API без токена через evaluate
    const result = await page.evaluate(async (apiUrl) => {
      try {
        const response = await fetch(`${apiUrl}/routes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // НЕ добавляем Authorization заголовок
          },
        });

        return {
          status: response.status,
          statusText: response.statusText,
          body: await response.text().catch(() => ''),
          ok: response.ok,
        };
      } catch (error) {
        return {
          status: 0,
          statusText: error instanceof Error ? error.message : 'Unknown error',
          body: '',
          ok: false,
        };
      }
    }, API_BASE_URL);

    // Проверяем, что получили ошибку авторизации
    expect(result.status).toBe(401);
    expect(result.ok).toBe(false);
  });

  test('Запрос к API с невалидным токеном должен вернуть ошибку 401', async ({ page }) => {
    // Загружаем страницу
    await page.goto('/');

    // Делаем запрос к API с невалидным токеном
    const result = await page.evaluate(async (apiUrl) => {
      try {
        const response = await fetch(`${apiUrl}/routes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid_token_12345',
          },
        });

        return {
          status: response.status,
          statusText: response.statusText,
          body: await response.text().catch(() => ''),
          ok: response.ok,
        };
      } catch (error) {
        return {
          status: 0,
          statusText: error instanceof Error ? error.message : 'Unknown error',
          body: '',
          ok: false,
        };
      }
    }, API_BASE_URL);

    // Проверяем, что получили ошибку авторизации
    expect(result.status).toBe(401);
    expect(result.ok).toBe(false);
  });

  test('Запрос к API с истекшим токеном должен вернуть ошибку 401', async ({ page }) => {
    // Загружаем страницу
    await page.goto('/');

    // Делаем запрос к API с истекшим токеном (формат JWT, но с истекшим временем)
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.expired';
    
    const result = await page.evaluate(async (apiUrl, token) => {
      try {
        const response = await fetch(`${apiUrl}/routes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        return {
          status: response.status,
          statusText: response.statusText,
          body: await response.text().catch(() => ''),
          ok: response.ok,
        };
      } catch (error) {
        return {
          status: 0,
          statusText: error instanceof Error ? error.message : 'Unknown error',
          body: '',
          ok: false,
        };
      }
    }, API_BASE_URL, expiredToken);

    // Проверяем, что получили ошибку авторизации
    expect(result.status).toBe(401);
    expect(result.ok).toBe(false);
  });

  test('Запрос к API без заголовка Authorization должен вернуть ошибку 401', async ({ page }) => {
    // Загружаем страницу
    await page.goto('/');

    // Делаем запрос к API без заголовка Authorization
    const result = await page.evaluate(async (apiUrl) => {
      try {
        const response = await fetch(`${apiUrl}/stations`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Полностью отсутствует заголовок Authorization
          },
        });

        return {
          status: response.status,
          statusText: response.statusText,
          body: await response.text().catch(() => ''),
          ok: response.ok,
        };
      } catch (error) {
        return {
          status: 0,
          statusText: error instanceof Error ? error.message : 'Unknown error',
          body: '',
          ok: false,
        };
      }
    }, API_BASE_URL);

    // Проверяем, что получили ошибку авторизации
    expect(result.status).toBe(401);
    expect(result.ok).toBe(false);
  });

  test('Запрос к API с пустым токеном должен вернуть ошибку 401', async ({ page }) => {
    // Загружаем страницу
    await page.goto('/');

    // Делаем запрос к API с пустым токеном
    const result = await page.evaluate(async (apiUrl) => {
      try {
        const response = await fetch(`${apiUrl}/routes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ',
          },
        });

        return {
          status: response.status,
          statusText: response.statusText,
          body: await response.text().catch(() => ''),
          ok: response.ok,
        };
      } catch (error) {
        return {
          status: 0,
          statusText: error instanceof Error ? error.message : 'Unknown error',
          body: '',
          ok: false,
        };
      }
    }, API_BASE_URL);

    // Проверяем, что получили ошибку авторизации
    expect(result.status).toBe(401);
    expect(result.ok).toBe(false);
  });

  test('Запрос к API с неправильным форматом токена должен вернуть ошибку 401', async ({ page }) => {
    // Загружаем страницу
    await page.goto('/');

    // Делаем запрос к API с токеном в неправильном формате (без "Bearer ")
    const result = await page.evaluate(async (apiUrl) => {
      try {
        const response = await fetch(`${apiUrl}/routes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'some_token_without_bearer_prefix',
          },
        });

        return {
          status: response.status,
          statusText: response.statusText,
          body: await response.text().catch(() => ''),
          ok: response.ok,
        };
      } catch (error) {
        return {
          status: 0,
          statusText: error instanceof Error ? error.message : 'Unknown error',
          body: '',
          ok: false,
        };
      }
    }, API_BASE_URL);

    // Проверяем, что получили ошибку авторизации
    expect(result.status).toBe(401);
    expect(result.ok).toBe(false);
  });

  test('Приложение должно корректно обрабатывать ошибку авторизации при загрузке данных', async ({ page }) => {
    // Перехватываем запросы к API и блокируем их или возвращаем 401
    await page.route(`${API_BASE_URL}/routes`, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    await page.route(`${API_BASE_URL}/stations`, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    // Загружаем страницу
    await page.goto('/');

    // Ждем, чтобы приложение попыталось загрузить данные
    await page.waitForTimeout(2000);

    // Проверяем, что приложение не упало и продолжает работать
    // (конкретная проверка зависит от того, как приложение обрабатывает ошибки)
    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toBeVisible();
  });
});
