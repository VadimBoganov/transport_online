import ws from 'k6/ws';
import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '30s', target: 1000 },   // Плавный рост до 1k пользователей за 30 сек
    { duration: '1m', target: 5000 },    // Рост до 5k за 1 минуту
    { duration: '2m', target: 10000 },    // Рост до 10k за 2 минуты
    { duration: '5m', target: 10000 },    // Держим 10k пользователей 5 минут
    { duration: '2m', target: 0 },        // Плавное снижение до 0
  ],
  thresholds: {
    'checks': ['rate>0.95'],              // 95% проверок прошли успешно
    'http_req_duration': ['p(95)<2000'],  // 95% HTTP запросов < 2 секунд
    'http_req_failed': ['rate<0.05'],     // Менее 5% неудачных HTTP запросов
    'ws_connecting': ['p(95)<3000'],      // 95% подключений < 3 секунд
    'ws_session_duration': ['p(95)<5000'], // 95% сессий < 5 секунд
  },
};

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8000/api';
const WS_BASE_URL = __ENV.WS_BASE_URL || 'ws://localhost:8000';
const WS_ORIGIN = __ENV.WS_ORIGIN || 'http://localhost:5173';

function getAuthToken() {
  const response = http.get(`${API_BASE_URL}/auth/token`);
  check(response, {
    'token получен': (r) => r.status === 200,
  });
  
  if (response.status === 200) {
    try {
      const data = JSON.parse(response.body);
      return data.token;
    } catch (e) {
      console.error('Ошибка парсинга токена:', e);
      return null;
    }
  }
  return null;
}

export default function () {
  const token = getAuthToken();
  if (!token) {
    console.error('Не удалось получить токен');
    return;
  }

  const wsUrl = `${WS_BASE_URL}/ws`;
  
  // Добавляем Origin заголовок для прохождения проверки на сервере
  const params = {
    headers: {
      'Origin': WS_ORIGIN,
    },
  };
  
  const response = ws.connect(wsUrl, params, function (socket) {
    let authenticated = false;
    let messagesReceived = 0;
    let lastPingTime = 0;

    socket.on('open', function () {
      const authMessage = JSON.stringify({
        type: 'auth',
        token: token,
      });
      socket.send(authMessage);
    });

    socket.on('message', function (data) {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'auth_success') {
          authenticated = true;
          
          // Подписка на обновления транспорта отключена по умолчанию
          // так как сервер требует непустой rids параметр
          // Для включения подписки раскомментируйте и укажите валидный rids:
          // const subscribeMessage = JSON.stringify({
          //   type: 'subscribe_vehicles',
          //   rids: '1,2,3', // ID маршрутов через запятую
          // });
          // socket.send(subscribeMessage);
        }
        
        if (message.type === 'pong') {
          // Успешный ping-pong
        }
        
        if (message.type === 'vehicles_update') {
          messagesReceived++;
        }
        
        if (message.type === 'error') {
          console.error('WebSocket error:', message.error);
        }
      } catch (e) {
        console.error('Ошибка парсинга сообщения:', e);
      }
    });

    socket.on('error', function (e) {
      console.error('WebSocket error:', e);
    });

    socket.on('close', function () {
    });
  });

  check(response, {
    'WebSocket подключен': (r) => r && r.status === 101,
  });

  // Держим соединение открытым в течение теста
  // В k6 соединение остается открытым пока функция default выполняется
  // Сервер сам отправляет ping каждые 54 секунды, мы отвечаем на pong автоматически
  // Для длительного теста используем sleep
  sleep(300); // Держим соединение открытым 5 минут
}
