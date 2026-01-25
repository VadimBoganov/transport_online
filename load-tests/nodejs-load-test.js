import WebSocket from 'ws';
import http from 'http';
import https from 'https';
import { performance } from 'perf_hooks';

const config = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000/api',
  WS_BASE_URL: process.env.WS_BASE_URL || 'ws://localhost:8000',
  WS_ORIGIN: process.env.WS_ORIGIN || 'http://localhost:5173', // Origin для WebSocket соединения
  SUBSCRIBE_VEHICLES: process.env.SUBSCRIBE_VEHICLES === 'true', // Подписываться на обновления транспорта
  VEHICLES_RIDS: process.env.VEHICLES_RIDS || '', // ID маршрутов для подписки (через запятую, например: "1,2,3")
  TOTAL_USERS: parseInt(process.env.TOTAL_USERS || '10000', 10),
  RAMP_UP_TIME: parseInt(process.env.RAMP_UP_TIME || '300000', 10), // 5 минут в мс
  TEST_DURATION: parseInt(process.env.TEST_DURATION || '300000', 10), // 5 минут
  CONNECTIONS_PER_BATCH: parseInt(process.env.CONNECTIONS_PER_BATCH || '100', 10),
  BATCH_INTERVAL: parseInt(process.env.BATCH_INTERVAL || '3000', 10), // 3 секунды между батчами
};

const stats = {
  total: 0,
  connected: 0,
  authenticated: 0,
  errors: 0,
  messagesReceived: 0,
  startTime: null,
  endTime: null,
  connections: [], // Храним активные соединения
};

async function getAuthToken() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${config.API_BASE_URL}/auth/token`);
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve(json.token);
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function createWebSocketConnection(userId) {
  return new Promise(async (resolve) => {
    try {
      const token = await getAuthToken();
      
      const wsUrl = `${config.WS_BASE_URL}/ws`;
      const ws = new WebSocket(wsUrl, {
        headers: {
          'Origin': config.WS_ORIGIN,
        },
      });
      
      let authenticated = false;
      let pingInterval = null;
      let messageCount = 0;
      
      ws.on('open', () => {
        stats.connected++;
        
        ws.send(JSON.stringify({
          type: 'auth',
          token: token,
        }));
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          messageCount++;
          stats.messagesReceived++;
          
          if (message.type === 'auth_success') {
            authenticated = true;
            stats.authenticated++;
            
            if (config.SUBSCRIBE_VEHICLES && config.VEHICLES_RIDS) {
              ws.send(JSON.stringify({
                type: 'subscribe_vehicles',
                rids: config.VEHICLES_RIDS,
              }));
            }
            
            pingInterval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
              }
            }, 30000);
          }
          
          if (message.type === 'pong') {
            // Успешный ping-pong
          }
          
          if (message.type === 'vehicles_update') {
            // Получено обновление
          }
          
          if (message.type === 'error') {
            console.error(`[User ${userId}] Error:`, message.error);
            stats.errors++;
          }
        } catch (e) {
          console.error(`[User ${userId}] Parse error:`, e.message);
        }
      });
      
      ws.on('error', (error) => {
        console.error(`[User ${userId}] WebSocket error:`, error.message);
        stats.errors++;
      });
      
      ws.on('close', () => {
        if (pingInterval) {
          clearInterval(pingInterval);
        }
        stats.connected--;
        const index = stats.connections.indexOf(ws);
        if (index > -1) {
          stats.connections.splice(index, 1);
        }
      });
      
      stats.connections.push(ws);
      resolve({ ws, authenticated: () => authenticated, messageCount: () => messageCount });
    } catch (error) {
      console.error(`[User ${userId}] Connection error:`, error.message);
      stats.errors++;
      resolve(null);
    }
  });
}

async function runBatch(batchNumber, batchSize) {
  const promises = [];
  
  for (let i = 0; i < batchSize; i++) {
    const userId = batchNumber * batchSize + i;
    if (userId >= config.TOTAL_USERS) break;
    
    promises.push(createWebSocketConnection(userId));
    stats.total++;
  }
  
  await Promise.all(promises);
  console.log(`Batch ${batchNumber} completed: ${batchSize} connections`);
}

async function runLoadTest() {
  console.log('=== Нагрузочное тестирование WebSocket ===');
  console.log(`Целевое количество пользователей: ${config.TOTAL_USERS}`);
  console.log(`API URL: ${config.API_BASE_URL}`);
  console.log(`WebSocket URL: ${config.WS_BASE_URL}`);
  console.log('---');
  
  stats.startTime = performance.now();
  
  const totalBatches = Math.ceil(config.TOTAL_USERS / config.CONNECTIONS_PER_BATCH);
  const batchInterval = config.RAMP_UP_TIME / totalBatches;
  
  console.log(`Запуск ${totalBatches} батчей с интервалом ${batchInterval}ms`);
  
  for (let i = 0; i < totalBatches; i++) {
    const batchSize = Math.min(
      config.CONNECTIONS_PER_BATCH,
      config.TOTAL_USERS - i * config.CONNECTIONS_PER_BATCH
    );
    
    runBatch(i, batchSize).catch(console.error);
    
    if (i < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, batchInterval));
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log(`Держим соединения открытыми в течение ${config.TEST_DURATION / 1000} секунд...`);
  await new Promise(resolve => setTimeout(resolve, config.TEST_DURATION));
  
  stats.endTime = performance.now();
  
  console.log('Закрываем все соединения...');
  stats.connections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });
  
  console.log('\n=== Результаты теста ===');
  console.log(`Всего попыток подключения: ${stats.total}`);
  console.log(`Успешно подключено: ${stats.connected}`);
  console.log(`Аутентифицировано: ${stats.authenticated}`);
  console.log(`Ошибок: ${stats.errors}`);
  console.log(`Сообщений получено: ${stats.messagesReceived}`);
  console.log(`Длительность теста: ${((stats.endTime - stats.startTime) / 1000).toFixed(2)}s`);
  if (stats.total > 0) {
    console.log(`Успешность подключений: ${((stats.connected / stats.total) * 100).toFixed(2)}%`);
  }
  if (stats.connected > 0) {
    console.log(`Успешность аутентификации: ${((stats.authenticated / stats.connected) * 100).toFixed(2)}%`);
  }
  
  process.exit(0);
}

process.on('SIGINT', () => {
  console.log('\n=== Прерывание теста ===');
  stats.endTime = performance.now();
  console.log(`Всего попыток: ${stats.total}`);
  console.log(`Подключено: ${stats.connected}`);
  console.log(`Аутентифицировано: ${stats.authenticated}`);
  
  stats.connections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });
  
  process.exit(0);
});

runLoadTest().catch(console.error);
