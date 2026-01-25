import { tokenService } from '@/services/tokenService';
import type { VehiclePosition, VehicleForecast } from '@/types/transport';

/**
 * Определяет URL для WebSocket соединения с автоматическим выбором протокола.
 * Если WS_BASE_URL уже содержит ws:// или wss://, используется как есть.
 * Иначе протокол определяется на основе текущего протокола страницы:
 * - HTTPS страница → wss://
 * - HTTP страница → ws://
 */
function getWebSocketUrl(): string {
  const envUrl = import.meta.env.WS_BASE_URL || 'localhost:8000';
  
  if (envUrl.startsWith('ws://') || envUrl.startsWith('wss://')) {
    return envUrl;
  }
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  let host = envUrl.replace(/^https?:\/\//, '');
  
  return `${protocol}//${host}`;
}

const WS_BASE_URL = getWebSocketUrl();

export type WSMessageType =
  | 'auth_required'
  | 'auth_success'
  | 'auth'
  | 'error'
  | 'vehicles_update'
  | 'station_forecast_update'
  | 'vehicle_forecast_update'
  | 'pong'
  | 'ping';

export interface WSMessage {
  type: WSMessageType;
  data?: any;
  error?: string;
  timestamp: number;
  rids?: string;
  sid?: number;
  vid?: string;
}

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: string) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isAuthenticated = false;
  private messageHandlers = new Map<WSMessageType, MessageHandler[]>();
  private errorHandlers: ErrorHandler[] = [];
  private pingInterval: number | null = null;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${WS_BASE_URL}/ws`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.authenticate();
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          this.notifyError('WebSocket connection error');
          reject(error);
        };

        this.ws.onclose = () => {
          this.isAuthenticated = false;
          this.stopPing();
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private async authenticate() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      // Получаем токен из токен-сервиса
      const token = await tokenService.getToken();

      this.send({
        type: 'auth',
        token,
      });
    } catch (error) {
      this.notifyError('Authentication failed');
    }
  }

  private handleMessage(data: string) {
    try {
      const message: WSMessage = JSON.parse(data);

      if (message.type === 'auth_success') {
        this.isAuthenticated = true;
        const handlers = this.messageHandlers.get('auth_success');
        if (handlers) {
          handlers.forEach((handler) => handler(null));
        }
      } else if (message.type === 'error') {
        this.notifyError(message.error || 'Unknown error');
      } else if (message.type === 'pong') {
      } else {
        const handlers = this.messageHandlers.get(message.type);
        if (handlers) {
          handlers.forEach((handler) => handler(message));
        }
      }
    } catch (error) {
    }
  }

  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribeVehicles(rids: string, handler: (data: VehiclePosition) => void) {
    const messageHandler = (message: WSMessage) => {
      if (!message.rids || message.rids === rids || !rids) {
        handler((message.data || message) as VehiclePosition);
      }
    };

    this.on('vehicles_update', messageHandler);

    if (this.isAuthenticated) {
      this.send({
        type: 'subscribe_vehicles',
        rids,
      });
    } else {
      const authHandler = () => {
        if (this.isAuthenticated) {
          this.send({
            type: 'subscribe_vehicles',
            rids,
          });
          this.off('auth_success', authHandler);
        }
      };
      this.on('auth_success', authHandler);
    }
  }

  subscribeStationForecast(sid: number, handler: (data: VehicleForecast[]) => void) {
    const messageHandler = (message: WSMessage) => {
      if (!message.sid || message.sid === sid) {
        handler((message.data || message) as VehicleForecast[]);
      }
    };

    this.on('station_forecast_update', messageHandler);

    if (this.isAuthenticated) {
      this.send({
        type: 'subscribe_station_forecast',
        sid,
      });
    } else {
      const authHandler = () => {
        if (this.isAuthenticated) {
          this.send({
            type: 'subscribe_station_forecast',
            sid,
          });
          this.off('auth_success', authHandler);
        }
      };
      this.on('auth_success', authHandler);
    }
  }

  subscribeVehicleForecast(vid: string, handler: (data: VehicleForecast[]) => void) {
    const messageHandler = (message: WSMessage) => {
      if (!message.vid || message.vid === vid) {
        handler((message.data || message) as VehicleForecast[]);
      }
    };

    this.on('vehicle_forecast_update', messageHandler);

    if (this.isAuthenticated) {
      this.send({
        type: 'subscribe_vehicle_forecast',
        vid,
      });
    } else {
      const authHandler = () => {
        if (this.isAuthenticated) {
          this.send({
            type: 'subscribe_vehicle_forecast',
            vid,
          });
          this.off('auth_success', authHandler);
        }
      };
      this.on('auth_success', authHandler);
    }
  }

  on(type: WSMessageType, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  off(type: WSMessageType, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  onError(handler: ErrorHandler) {
    this.errorHandlers.push(handler);
  }

  private notifyError(error: string) {
    this.errorHandlers.forEach((handler) => handler(error));
  }

  private startPing() {
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000);
  }

  private stopPing() {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        this.connect().catch(() => {
        });
      }, delay);
    } else {
      this.notifyError('Failed to reconnect to WebSocket');
    }
  }

  disconnect() {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isAuthenticated = false;
    this.messageHandlers.clear();
    this.errorHandlers = [];
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN && this.isAuthenticated;
  }
}

let wsClientInstance: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!wsClientInstance) {
    wsClientInstance = new WebSocketClient();
  }
  return wsClientInstance;
}
