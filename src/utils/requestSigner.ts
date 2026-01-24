/**
 * Утилита для создания HMAC подписи запросов
 */

/**
 * Создает HMAC-SHA256 подпись для запроса
 * @param method HTTP метод (GET, POST, etc.)
 * @param path Путь запроса (например, /api/routes или /api/routenodes/123)
 * @param queryParams Query параметры
 * @param pathParams Path параметры (например, { rid: 123 })
 * @param timestamp Временная метка запроса
 */
export async function signRequest(
  method: string,
  path: string,
  queryParams: Record<string, string | number> = {},
  pathParams: Record<string, string | number> = {},
  timestamp: number = Date.now()
): Promise<{ signature: string; timestamp: number }> {
  const secretKey = import.meta.env.REST_SECRET_KEY || '';
  
  if (!secretKey) {
    throw new Error('REST_SECRET_KEY is not set');
  }

  // Объединяем все параметры
  const allParams: Record<string, string | number> = {
    ...queryParams,
    ...pathParams,
  };

  // Сортируем параметры для консистентности
  const sortedParams = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // Формируем строку для подписи: method + path + params + timestamp
  const signString = `${method}${path}${sortedParams}${timestamp}`;

  // Используем Web Crypto API для HMAC
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(signString);

  // Создаем ключ для HMAC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Вычисляем подпись
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

  // Конвертируем в hex строку
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    signature: signatureHex,
    timestamp,
  };
}

/**
 * Создает токен для WebSocket аутентификации
 */
export async function createWSAuthToken(timestamp: number = Date.now()): Promise<string> {
  const secretKey = import.meta.env.WS_SECRET_KEY || '';
  
  if (!secretKey) {
    throw new Error('WS_SECRET_KEY is not set');
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(timestamp.toString());

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const token = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return token;
}
