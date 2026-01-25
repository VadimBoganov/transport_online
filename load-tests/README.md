# Нагрузочное тестирование

Нагрузочные тесты для проверки способности системы обрабатывать 10,000 одновременных WebSocket подключений.

## Требования

### Для k6 тестов:
- [k6](https://k6.io/docs/getting-started/installation/) установлен и доступен в PATH
- Рекомендуется версия k6 v0.47.0 или выше

**Установка k6:**
```bash
# Windows (через Chocolatey)
choco install k6

# Windows (через Scoop)
scoop install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D6B
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# macOS
brew install k6
```

### Для Node.js тестов:
- Node.js 18+
- Установленные зависимости: `npm install`

## Использование

### k6 тест (рекомендуется)

k6 предоставляет более детальную аналитику и метрики в реальном времени.

```bash
# Базовый запуск
npm run load-test:k6

# С кастомными параметрами
API_BASE_URL=http://localhost:8000/api WS_BASE_URL=ws://localhost:8000 WS_ORIGIN=http://localhost:5173 k6 run load-tests/k6-websocket-test.js

# Переменные окружения для k6:
# - API_BASE_URL: URL API сервера (по умолчанию: http://localhost:8000/api)
# - WS_BASE_URL: URL WebSocket сервера (по умолчанию: ws://localhost:8000)
# - WS_ORIGIN: Origin заголовок для WebSocket (по умолчанию: http://localhost:5173)

# С выводом результатов в файл
k6 run --out json=load-tests/results/k6-results.json load-tests/k6-websocket-test.js

# С выводом в InfluxDB (если настроен)
k6 run --out influxdb=http://localhost:8086/k6 load-tests/k6-websocket-test.js

# С кастомным сценарием нагрузки
k6 run --vus 5000 --duration 10m load-tests/k6-websocket-test.js
```

**Настройка сценария нагрузки в k6:**

Отредактируйте `options.stages` в `k6-websocket-test.js`:

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 1000 },   // Рост до 1k за 1 минуту
    { duration: '3m', target: 5000 },    // Рост до 5k за 3 минуты
    { duration: '5m', target: 10000 },   // Рост до 10k за 5 минут
    { duration: '10m', target: 10000 },   // Держим 10k пользователей 10 минут
    { duration: '2m', target: 0 },        // Плавное снижение
  ],
};
```

### Node.js тест

Node.js скрипт предоставляет больше гибкости в настройке и отладке.

```bash
# Базовый запуск (10k пользователей)
npm run load-test:node

# С кастомными параметрами
TOTAL_USERS=5000 RAMP_UP_TIME=120000 npm run load-test:node

# Переменные окружения:
# - TOTAL_USERS: количество пользователей (по умолчанию: 10000)
# - RAMP_UP_TIME: время нарастания нагрузки в мс (по умолчанию: 300000 = 5 минут)
# - TEST_DURATION: длительность теста в мс (по умолчанию: 300000 = 5 минут)
# - CONNECTIONS_PER_BATCH: подключений в батче (по умолчанию: 100)
# - BATCH_INTERVAL: интервал между батчами в мс (по умолчанию: 3000)
# - API_BASE_URL: URL API сервера (по умолчанию: http://localhost:8000/api)
# - WS_BASE_URL: URL WebSocket сервера (по умолчанию: ws://localhost:8000)
# - WS_ORIGIN: Origin заголовок для WebSocket (по умолчанию: http://localhost:5173)
# - SUBSCRIBE_VEHICLES: подписываться на обновления транспорта (по умолчанию: false)
# - VEHICLES_RIDS: ID маршрутов для подписки через запятую (например: "1,2,3")

# Пример: тест с 5k пользователей, нарастание за 2 минуты
TOTAL_USERS=5000 RAMP_UP_TIME=120000 TEST_DURATION=180000 npm run load-test:node
```

## Что тестируется

1. **Подключение к WebSocket**: Установление соединения с сервером
2. **Аутентификация**: Получение токена через HTTP и успешная аутентификация через WebSocket
3. **Подписки**: Подписка на обновления транспорта (`subscribe_vehicles`)
4. **Ping/Pong**: Поддержание соединения через ping каждые 30 секунд
5. **Обработка сообщений**: Получение и обработка обновлений транспорта (`vehicles_update`)
6. **Устойчивость**: Длительное удержание большого количества соединений

## Метрики

### k6 метрики:
- `ws_connecting`: Процент успешных подключений (threshold: >95%)
- `ws_session_duration`: Длительность сессии, p95 < 5 секунд
- `ws_ping`: Процент успешных ping (threshold: >90%)
- `http_req_duration`: Длительность HTTP запросов для получения токенов
- `http_req_failed`: Процент неудачных HTTP запросов

### Node.js метрики:
- **Общее количество попыток подключения**: Сколько всего попыток было сделано
- **Количество успешных подключений**: Сколько WebSocket соединений установлено
- **Количество успешных аутентификаций**: Сколько пользователей успешно аутентифицировано
- **Количество ошибок**: Общее количество ошибок (подключение, аутентификация, парсинг)
- **Количество полученных сообщений**: Сколько сообщений получено от сервера
- **Процент успешности**: Процент успешных подключений и аутентификаций
- **Длительность теста**: Общее время выполнения теста

## Рекомендации

1. **Запускайте тесты на отдельной машине** от сервера, чтобы не влиять на результаты
2. **Мониторьте ресурсы сервера** во время теста:
   - CPU использование
   - Память (RAM)
   - Сетевой трафик
   - Количество открытых файловых дескрипторов
3. **Начните с меньшего количества пользователей** (например, 1000) и постепенно увеличивайте
4. **Проверьте лимиты системы** перед запуском:
   ```bash
   # Linux/Mac
   ulimit -n  # Проверить текущий лимит
   ulimit -n 65536  # Увеличить лимит
   
   # Windows - настройте через системные параметры или используйте команду:
   # netsh int tcp set global autotuninglevel=normal
   ```
5. **Используйте k6 для более детальной аналитики** и графиков производительности
6. **Используйте Node.js скрипт для отладки** и более гибкой настройки параметров

## Устранение проблем

### Ошибка "too many open files"
**Проблема**: Система не может открыть больше файловых дескрипторов.

**Решение:**
```bash
# Linux/Mac
ulimit -n 65536

# Проверка текущего лимита
ulimit -n

# Windows - настройте через системные параметры или используйте:
# Увеличьте лимит в настройках системы или используйте меньшее количество пользователей
```

### Медленные подключения
**Проблема**: Подключения устанавливаются слишком медленно.

**Решения:**
- Проверьте сетевую задержку между клиентом и сервером
- Увеличьте `RAMP_UP_TIME` для более плавного нарастания нагрузки
- Уменьшите `CONNECTIONS_PER_BATCH` для меньшей нагрузки на сеть
- Проверьте производительность сервера (CPU, память)

### Высокое потребление памяти
**Проблема**: Тест потребляет слишком много памяти.

**Решения:**
- Уменьшите `TOTAL_USERS`
- Увеличьте интервалы между батчами (`BATCH_INTERVAL`)
- Запустите тест на машине с большим объемом RAM
- Используйте k6 вместо Node.js скрипта (k6 более оптимизирован)

### Ошибки аутентификации
**Проблема**: Многие пользователи не могут аутентифицироваться.

**Решения:**
- Проверьте, что эндпоинт `/api/auth/token` доступен и работает
- Проверьте лимиты rate limiting на сервере
- Увеличьте задержки между запросами токенов
- Проверьте логи сервера на наличие ошибок

### WebSocket соединения закрываются
**Проблема**: Соединения закрываются преждевременно.

**Решения:**
- Проверьте таймауты на сервере
- Убедитесь, что ping/pong работают корректно
- Проверьте настройки keep-alive
- Увеличьте интервал ping (но не слишком, чтобы не превысить таймаут сервера)

### Ошибка "websocket: request origin not allowed by Upgrader.CheckOrigin"
**Проблема**: Сервер отклоняет WebSocket соединения из-за неправильного Origin заголовка.

**Решение:**
- Убедитесь, что переменная `WS_ORIGIN` установлена в одно из разрешенных значений на сервере
- По умолчанию разрешены: `http://localhost:3000` и `http://localhost:5173`
- Если используется другой origin, установите переменную окружения:
  ```bash
  WS_ORIGIN=http://localhost:5173 npm run load-test:node
  ```
- Или настройте сервер, добавив нужный origin в переменную окружения `ALLOWED_ORIGINS` на сервере

## Примеры использования

### Быстрый тест с 1k пользователей
```bash
# k6
k6 run --vus 1000 --duration 2m load-tests/k6-websocket-test.js

# Node.js
TOTAL_USERS=1000 RAMP_UP_TIME=60000 TEST_DURATION=120000 npm run load-test:node
```

### Длительный тест с 10k пользователями
```bash
# k6 - измените stages в скрипте для длительного теста
k6 run load-tests/k6-websocket-test.js

# Node.js
TOTAL_USERS=10000 RAMP_UP_TIME=300000 TEST_DURATION=600000 npm run load-test:node
```

### Тест с сохранением результатов
```bash
# k6 - JSON вывод
k6 run --out json=load-tests/results/$(date +%Y%m%d_%H%M%S).json load-tests/k6-websocket-test.js

# k6 - CSV вывод
k6 run --out csv=load-tests/results/results.csv load-tests/k6-websocket-test.js
```

## Мониторинг во время теста

### На сервере (Linux):
```bash
# Мониторинг соединений
netstat -an | grep :8000 | wc -l
ss -tn | grep :8000 | wc -l

# Мониторинг ресурсов
top
htop
iotop

# Мониторинг файловых дескрипторов
lsof -p <PID> | wc -l
cat /proc/<PID>/limits
```

### На клиенте (где запущен тест):
```bash
# Мониторинг сетевых соединений
netstat -an | grep ESTABLISHED | wc -l

# Мониторинг ресурсов процесса
top -p <PID>
```

## Дополнительные ресурсы

- [k6 документация](https://k6.io/docs/)
- [k6 WebSocket примеры](https://k6.io/docs/javascript-api/k6-ws/)
- [ws библиотека для Node.js](https://github.com/websockets/ws)
