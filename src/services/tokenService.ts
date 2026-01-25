/**
 * Сервис для управления токенами аутентификации
 * Токены выдаются бэкендом и используются для доступа к API и WebSocket
 */

interface TokenResponse {
  token: string;
  expires_at: number;
  ttl: number;
}

class TokenService {
  private token: string | null = null;
  private expiresAt: number = 0;
  private refreshPromise: Promise<string> | null = null;


  async getToken(): Promise<string> {
    // Если токен валиден, возвращаем его
    if (this.token && Date.now() < this.expiresAt - 60000) { // Обновляем за минуту до истечения
      return this.token;
    }

    // Если уже идет запрос на обновление, ждем его
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Запрашиваем новый токен
    this.refreshPromise = this.fetchToken();
    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }


  private async fetchToken(): Promise<string> {
    const API_BASE_URL = import.meta.env.API_BASE_URL || 'http://localhost:8000/api';

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.statusText}`);
      }

      const data: TokenResponse = await response.json();

      this.token = data.token;
      this.expiresAt = data.expires_at * 1000; // Конвертируем в миллисекунды

      return this.token;
    } catch (error) {
      console.error('Error fetching token:', error);
      throw error;
    }
  }


  clearToken(): void {
    this.token = null;
    this.expiresAt = 0;
  }


  hasValidToken(): boolean {
    return this.token !== null && Date.now() < this.expiresAt;
  }
}

export const tokenService = new TokenService();
