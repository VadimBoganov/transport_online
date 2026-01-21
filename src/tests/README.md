# Тесты для Services

Все сервисы из папки `@src/services/` покрыты unit-тестами.

## Покрытие

### ✅ forecastService.test.ts
Тесты для `forecastService.ts`:
- `sortForecastsByArrivalTime` - сортировка прогнозов по времени прибытия
- `formatArrivalMinutes` - форматирование секунд в минуты
- `isForecastValid` - проверка валидности прогноза
- `processForecasts` - обработка прогнозов
- `makeVehicleForecasts` - группировка прогнозов по транспорту

**Покрыто:** 5/5 функций (100%)

### ✅ mapProjection.test.ts
Тесты для `mapProjection.ts`:
- `latLonToCanvasPixel` - конвертация координат в пиксели canvas
- `canvasPixelToLatLon` - конвертация пикселей в координаты
- Round-trip conversions - проверка точности обратных конвертаций

**Покрыто:** 2/2 функции (100%)

### ✅ routeService.test.ts
Тесты для `routeService.ts`:
- `buildRouteNodesMap` - построение карты узлов маршрутов
- `buildRouteGeoJSON` - построение GeoJSON для маршрутов
- `getActiveRoutes` - получение активных маршрутов
- `makeRouteIdsString` - формирование строки ID маршрутов

**Покрыто:** 4/4 функции (100%)

### ✅ vehicleFilterService.test.ts (vehicleService.test.ts)
Тесты для `vehicleService.ts`:
- `buildSelectedVehicleGeoJSON` - построение GeoJSON для выбранного транспорта
- `filterVehiclesBySelectedRoutes` - фильтрация транспорта по маршрутам

**Покрыто:** 2/2 функции (100%)

### ✅ viewport.test.ts
Тесты для `viewport.ts`:
- `calculateViewportBounds` - расчет границ области просмотра
- `isPointInViewport` - проверка нахождения точки в области просмотра
- `isPointInMapBounds` - проверка нахождения точки в границах карты

**Покрыто:** 3/3 функции (100%)

### ✅ stationService.test.ts
Тесты для `stationService.ts`:
- `shouldOpenStationPopup` - проверка необходимости открытия попапа остановки

**Покрыто:** 1/1 функция (100%)

## Статистика

- **Всего тестовых файлов:** 6
- **Всего тестов:** 82
- **Успешных:** 82 (100%)
- **Провалившихся:** 0

## Запуск тестов

```bash
# Запуск всех тестов
npm test

# Запуск с UI
npm test -- --ui

# Запуск в watch режиме
npm test -- --watch

# Запуск конкретного файла
npm test -- forecastService.test.ts
```

## Структура тестов

Все тесты следуют единому стилю:
- Используется Vitest как тестовый фреймворк
- Группировка через `describe` блоки
- Четкие названия тестов (`it` / `test`)
- Проверка граничных случаев (edge cases)
- Проверка обработки ошибок и undefined значений

## Тестовые данные

Моковые данные создаются для каждого теста и соответствуют реальным типам из `@/types/transport`.

## Примечания

- Все функции протестированы на различные сценарии использования
- Покрыты edge cases (пустые массивы, undefined, null)
- Проверена корректность математических вычислений (координаты, проекции)
- Протестирована работа с различными состояниями загрузки (isLoading, isError)
