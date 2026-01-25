import { test, expect } from '@playwright/test';

/**
 * Тесты для проверки обработки ошибок авторизации
 * Имитируют запросы браузера к API без токена или с невалидным токеном
 * 
 * Важно: Все запросы включают заголовки браузера (Origin, User-Agent, Sec-Fetch-Site),
 * чтобы пройти проверки middleware перед проверкой токена.
 * Без этих заголовков сервер вернет 403 (Forbidden) вместо 401 (Unauthorized).
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';

// Тип для ответа API в тестах
type ApiResponse = {
  status: number;
  statusText: string;
  body: string;
  ok: boolean;
};

test.describe('Ошибки авторизации API', () => {
  test('Запрос к API без токена авторизации должен вернуть ошибку 401', async ({ page }) => {
    // Загружаем страницу
    await page.goto('/');

    // Делаем запрос к API без токена через evaluate
    // Добавляем заголовки браузера для прохождения проверок middleware
    const result = await page.evaluate(async (apiUrl: string) => {
      try {
        const response = await fetch(`${apiUrl}/routes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Sec-Fetch-Site': 'same-origin',
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
    }, API_BASE_URL) as { status: number; statusText: string; body: string; ok: boolean };

    // Проверяем, что получили ошибку авторизации
    expect(result.status).toBe(401);
    expect(result.ok).toBe(false);
  });

  test('Запрос к API с невалидным токеном должен вернуть ошибку 401', async ({ page }) => {
    // Загружаем страницу
    await page.goto('/');

    // Делаем запрос к API с невалидным токеном
    const result = await page.evaluate(async (apiUrl: string) => {
      try {
        const response = await fetch(`${apiUrl}/routes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Sec-Fetch-Site': 'same-origin',
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
    }, API_BASE_URL) as ApiResponse;

    // Проверяем, что получили ошибку авторизации
    expect(result.status).toBe(401);
    expect(result.ok).toBe(false);
  });

  test('Запрос к API с истекшим токеном должен вернуть ошибку 401', async ({ page }) => {
    // Загружаем страницу
    await page.goto('/');

    // Создаем истекший токен в формате сервера: randomPart:timestamp:signature
    // Используем старый timestamp (более 1 часа назад) для имитации истекшего токена
    // Сервер проверяет: time.Since(timestamp) > tokenTTL (1 час)
    const oldTimestamp = Math.floor(Date.now() / 1000) - 7200; // 2 часа назад
    const expiredToken = `expired_random_part:${oldTimestamp}:invalid_signature`;
    
    const result = await page.evaluate(async ({ apiUrl, token }: { apiUrl: string; token: string }) => {
      try {
        const response = await fetch(`${apiUrl}/routes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Sec-Fetch-Site': 'same-origin',
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
    }, { apiUrl: API_BASE_URL, token: expiredToken });

    // Проверяем, что получили ошибку авторизации
    // Сервер должен вернуть 401 для истекшего или невалидного токена
    // Если токен в неправильном формате, ValidateToken вернет false и вернется 401
    const apiResult = result as ApiResponse;
    expect(apiResult.status).toBe(401);
    expect(apiResult.ok).toBe(false);
    
    // Дополнительно проверяем, что в теле ответа есть информация об ошибке
    if (apiResult.body) {
      expect(apiResult.body).toContain('error');
    }
  });

  test('Запрос к API без заголовка Authorization должен вернуть ошибку 401', async ({ page }) => {
    // Загружаем страницу
    await page.goto('/');

    // Делаем запрос к API без заголовка Authorization
    const result = await page.evaluate(async (apiUrl: string) => {
      try {
        const response = await fetch(`${apiUrl}/stations`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Sec-Fetch-Site': 'same-origin',
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
    }, API_BASE_URL) as ApiResponse;

    // Проверяем, что получили ошибку авторизации
    expect(result.status).toBe(401);
    expect(result.ok).toBe(false);
  });

  test('Запрос к API с пустым токеном должен вернуть ошибку 401', async ({ page }) => {
    // Загружаем страницу
    await page.goto('/');

    // Делаем запрос к API с пустым токеном
    const result = await page.evaluate(async (apiUrl: string) => {
      try {
        const response = await fetch(`${apiUrl}/routes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Sec-Fetch-Site': 'same-origin',
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
    }, API_BASE_URL) as ApiResponse;

    // Проверяем, что получили ошибку авторизации
    expect(result.status).toBe(401);
    expect(result.ok).toBe(false);
  });

  test('Запрос к API с неправильным форматом токена должен вернуть ошибку 401', async ({ page }) => {
    // Загружаем страницу
    await page.goto('/');

    // Делаем запрос к API с токеном в неправильном формате (без "Bearer ")
    const result = await page.evaluate(async (apiUrl: string) => {
      try {
        const response = await fetch(`${apiUrl}/routes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Sec-Fetch-Site': 'same-origin',
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
    }, API_BASE_URL) as ApiResponse;

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
