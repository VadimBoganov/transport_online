/**
 * Конфигурация для нагрузочных тестов
 * Используется как справочная информация для настройки тестов
 */

export const defaultConfig = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000/api',
  WS_BASE_URL: process.env.WS_BASE_URL || 'ws://localhost:8000',
  
  TOTAL_USERS: parseInt(process.env.TOTAL_USERS || '10000', 10),
  RAMP_UP_TIME: parseInt(process.env.RAMP_UP_TIME || '300000', 10), // 5 минут в мс
  TEST_DURATION: parseInt(process.env.TEST_DURATION || '300000', 10), // 5 минут
  CONNECTIONS_PER_BATCH: parseInt(process.env.CONNECTIONS_PER_BATCH || '100', 10),
  BATCH_INTERVAL: parseInt(process.env.BATCH_INTERVAL || '3000', 10), // 3 секунды
  
  thresholds: {
    ws_connecting: 0.95,      // 95% успешных подключений
    ws_session_duration: 5000, // 95% сессий < 5 секунд
    ws_ping: 0.9,              // 90% успешных ping
  },
  
  PING_INTERVAL: 30000,        // Ping каждые 30 секунд
  RECONNECT_DELAY: 1000,       // Задержка перед переподключением
  MAX_RECONNECT_ATTEMPTS: 5,   // Максимум попыток переподключения
};
