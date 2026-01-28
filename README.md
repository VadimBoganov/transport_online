# Transport Online

Веб-приложение для мониторинга общественного транспорта в реальном времени. Отслеживайте автобусы, троллейбусы и маршрутные такси на интерактивной карте города.

![Version](https://img.shields.io/badge/version-1.2.2-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646cff.svg)

## Основные возможности

- **Интерактивная карта** с отображением транспорта в реальном времени
- **WebSocket соединение** для получения обновлений позиций транспорта и прогнозов в реальном времени
- **Мониторинг маршрутов** автобусов, троллейбусов и маршрутных такси
- **Остановки** с информацией о времени прибытия транспорта
- **Выбор нескольких маршрутов** одновременно для отслеживания
- **Прогнозы прибытия** для каждой остановки и транспортного средства
- **Современный UI** с Bootstrap 5 и React Bootstrap
- **Адаптивный дизайн** для работы на различных устройствах (desktop, tablet, mobile)
- **Автообновление** позиций транспорта с плавной анимацией
- **Canvas-рендеринг** для эффективного отображения большого количества транспорта
- **Автоматическое переподключение** WebSocket при обрыве соединения

### Требования

- Node.js 18+ (рекомендуется 20+)
- npm 9+

### Установка

```bash
# Клонировать репозиторий
git clone <repository-url>
cd transport_online

# Установить зависимости
npm install

# Установить браузеры для E2E тестов (опционально)
npx playwright install
```

### Запуск приложения

```bash
# Запуск в режиме разработки
npm run dev

# Приложение будет доступно по адресу: http://localhost:5173
```

### Сборка для продакшена

```bash
# Сборка проекта
npm run build

# Предпросмотр продакшен сборки
npm run preview
```

## Docker

Проект полностью готов к работе с Docker. Доступны два режима: production и development.

### Production (Docker)

```bash
# Сборка production образа с указанием API URL
docker build -t transport-online:latest \
  --build-arg API_BASE_URL=http://your-api-server:8000/api .

# Запуск контейнера
docker run -d -p 8080:80 \
  --name transport-online \
  transport-online:latest

# Приложение будет доступно по адресу: http://localhost:8080
```

**Важно**: Переменная `API_BASE_URL` должна быть указана при сборке образа через `--build-arg`, так как Vite встраивает переменные окружения в код во время сборки.

### Development (Docker)

```bash
# Сборка development образа
docker build -f Dockerfile.dev -t transport-online:dev .

# Запуск контейнера с hot reload
docker run -d -p 5173:5173 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -e API_BASE_URL=http://localhost:8000/api \
  --name transport-online-dev \
  transport-online:dev
```

### Docker Compose

Использование docker-compose для упрощения управления:

```bash
# Production режим
docker-compose up -d app

# Development режим
docker-compose --profile dev up -d app-dev

# Или использовать отдельный файл для разработки
docker-compose -f docker-compose.dev.yml up -d

# Просмотр логов
docker-compose logs -f app

# Остановка
docker-compose down
```

**Переменные окружения:**

Создайте файл `.env` в корне проекта:

```env
API_BASE_URL=http://your-api-server:8000/api
WS_BASE_URL=your-websocket-server:8000
```

Или передайте переменные напрямую:

```bash
API_BASE_URL=http://api.example.com/api WS_BASE_URL=ws.example.com docker-compose up -d app
```

**Примечание**: `WS_BASE_URL` используется для WebSocket соединения. Протокол (ws:// или wss://) определяется автоматически на основе протокола текущей страницы. Если указать полный URL с протоколом (например, `wss://ws.example.com`), он будет использован как есть.

**Порты:**

- Production: `49050` (внутри контейнера: `80`)
- Development: `5173` (внутри контейнера: `5173`)

### Docker Compose файлы

- `docker-compose.yml` - основной файл с production и development сервисами
- `docker-compose.dev.yml` - упрощенный файл только для development

## Тестирование

Проект имеет комплексное покрытие тестами на двух уровнях:

### Unit тесты (Vitest)

**Покрытие**: 100% всех сервисов

```bash
# Запуск всех unit тестов
npm test

# Запуск с UI
npm test -- --ui

# Запуск в watch режиме
npm test -- --watch

# Запуск конкретного файла
npm test -- forecastService.test.ts

# Генерация отчета о покрытии
npm test -- --coverage
```

Подробнее: [`src/tests/README.md`](src/tests/README.md)

### E2E тесты (Playwright)

```bash
# Запуск всех E2E тестов
npm run test:e2e

# Запуск в UI режиме (рекомендуется для разработки)
npm run test:e2e:ui

# Запуск с видимым браузером
npm run test:e2e:headed

# Запуск в debug режиме
npm run test:e2e:debug

# Просмотр отчета
npm run test:e2e:report
```
Подробнее: [`src/tests/e2e/README.md`](src/tests/e2e/README.md)

### Нагрузочное тестирование (Load Tests)

Проект включает инструменты для нагрузочного тестирования WebSocket соединений:

```bash
# Нагрузочное тестирование с помощью k6
npm run load-test:k6

# Нагрузочное тестирование с помощью Node.js
npm run load-test:node
```

**Переменные окружения для нагрузочных тестов:**

```bash
API_BASE_URL=http://localhost:8000/api
WS_BASE_URL=ws://localhost:8000
WS_ORIGIN=http://localhost:5173
```

Подробнее: [`src/tests/load-tests/README.md`](src/tests/load-tests/README.md)

## Конфигурация

### Основная конфигурация (`config.ts`)

```typescript
const config = {
  map: {
    lat: 54.628723,              // Начальная широта
    lng: 39.716815,              // Начальная долгота
    zoom: 15,                    // Начальный зум (desktop)
    stationSelectZoom: 17,       // Зум при выборе остановки (desktop)
    mobileZoom: 14,              // Начальный зум для мобильных устройств
    mobileStationSelectZoom: 15, // Зум при выборе остановки на мобильных
  },
  routes: [
    { title: 'Автобусы', type: 'А', color: 'green' },
    { title: 'Троллейбусы', type: 'Т', color: 'blue' },
    // { title: 'Маршрутные такси', type: 'М', color: '#ff6a00' },
  ],
  routeIconSize: 18,
  routeLineWeight: 3,
  vehicleMarkers: {
    borderColor: '#00a8ff',
    lowFloorBorderColor: 'white',
  },
};
```

**Адаптивность:**

- Desktop: ширина экрана ≥ 1280px
- Tablet/Mobile: ширина экрана < 1280px
- На мобильных устройствах автоматически отключаются hover-подсказки
- Попапы центрируются на экране для удобного просмотра

## API

Приложение работает с внешним API транспортной системы через REST API и WebSocket соединение.

### REST API эндпоинты

```typescript
// Получение списка маршрутов
GET /api/routes

// Получение узлов маршрута
GET /api/routenodes/{routeId}


// Получение списка остановок
GET /api/stations

```

**Примечания:**
- Все запросы требуют аутентификации через Bearer токен в заголовке `Authorization`
- `{routeId}` - числовой идентификатор маршрута
- `{rids}` - строка с идентификаторами маршрутов, разделенными запятой (URL-encoded)

### WebSocket API

Приложение использует WebSocket для получения обновлений в реальном времени:

**Подключение:**
```
ws://your-server:8000/ws
или
wss://your-server:8000/ws (для HTTPS)
```

**Типы сообщений:**

- `auth` - аутентификация (требуется токен)
- `auth_success` - успешная аутентификация
- `vehicles_update` - обновление позиций транспорта
- `station_forecast_update` - обновление прогноза для остановки
- `vehicle_forecast_update` - обновление прогноза для транспортного средства
- `ping`/`pong` - поддержание соединения

**Особенности:**

- Автоматическое переподключение при обрыве соединения с экспоненциальной задержкой (максимум 30 секунд)
- Ping каждые 30 секунд для поддержания соединения
- Автоматическая аутентификация при подключении
- Подписка на обновления по маршрутам, остановкам и транспортным средствам

### Оптимизация

- **React Query** для кеширования API запросов
- **TanStack Virtual** для виртуализации длинных списков
- **Canvas API** для эффективного рендеринга большого количества объектов
- **WebSocket** для получения обновлений в реальном времени без постоянных HTTP запросов
- **Адаптивная фильтрация** транспорта по видимой области карты
- **Ограничение количества рендерируемых объектов** в зависимости от уровня зума
- **Мемоизация компонентов** для предотвращения лишних перерисовок
- **Debounce** для событий изменения границ карты

### Линтинг и форматирование

```bash
# Проверка кода
npm run lint
```

### Анализ bundle

```bash
# Установить анализатор (если нужно)
npm install --save-dev rollup-plugin-visualizer

# Сборка с анализом
npm run build
```

## Troubleshooting

### Часто встречающиеся проблемы

**Проблема**: Тесты Playwright не запускаются

```bash
# Решение: переустановить браузеры
npx playwright install --with-deps
```

**Проблема**: Ошибки TypeScript при сборке

```bash
# Решение: очистить кеш и переустановить зависимости
rm -rf node_modules package-lock.json
npm install
```

**Проблема**: WebSocket соединение не устанавливается

```bash
# Проверьте переменные окружения:
# - WS_BASE_URL должен быть указан в .env файле
# - Для HTTPS используйте wss:// протокол
# - Убедитесь, что сервер WebSocket доступен по указанному адресу
```

**Проблема**: Маркеры транспорта не обновляются на мобильных устройствах

```bash
# Это может быть связано с:
# - Нестабильным сетевым соединением (WebSocket автоматически переподключается)
# - Батареей устройства (некоторые браузеры приостанавливают WebSocket в фоне)
# - Проверьте логи браузера на наличие ошибок WebSocket
```

## Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

**Требования к коду:**
- Все новые функции должны быть покрыты тестами
- Следуйте существующему code style
- Обновите документацию при необходимости
- Проверьте, что все тесты проходят

## Лицензия

Этот проект распространяется по лицензии **Apache License 2.0**.
Полный текст лицензии доступен в файле `LICENSE` в корне репозитория
или по адресу: http://www.apache.org/licenses/LICENSE-2.0

---

**Version**: 1.2.2  
**Last Updated**: January 2026
