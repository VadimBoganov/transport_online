import { API_ENDPOINTS } from './endpoints';
import { tokenService } from '@/services/tokenService';
import type { Route, Station, RouteNode } from '@/types/transport';

export interface ApiError {
  message: string;
  status: number;
  statusText: string;
}

export class ApiClientError extends Error {
  status: number;
  statusText: string;

  constructor(
    status: number,
    statusText: string,
    message?: string
  ) {
    super(message || `HTTP error! status: ${status}, statusText: ${statusText}`);
    this.name = 'ApiClientError';
    this.status = status;
    this.statusText = statusText;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
}

class ApiClient {
  private baseHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
    });
  }


  async post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }

  private async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const { params = {}, ...fetchOptions } = options;

    // Получаем токен (автоматически обновляется при необходимости)
    const token = await tokenService.getToken();

    let finalUrl = url;
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      finalUrl = `${url}?${searchParams.toString()}`;
    }

    try {
      const response = await fetch(finalUrl, {
        ...fetchOptions,
        headers: {
          ...this.baseHeaders,
          'Authorization': `Bearer ${token}`,
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new ApiClientError(
          response.status,
          response.statusText,
          errorText || `HTTP error! status: ${response.status}`
        );
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return null as T;
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError(
        0,
        'Network Error',
        error instanceof Error ? error.message : 'Неизвестная ошибка сети'
      );
    }
  }
}

export const apiClient = new ApiClient();

export const api = {
  routes: {
    getAll: () => apiClient.get<Route[] | { routes: Route[] }>(API_ENDPOINTS.routes()),
  },
  stations: {
    getAll: () => apiClient.get<Station[] | { stations: Station[] }>(API_ENDPOINTS.stations()),
  },
  routeNodes: {
    getByRouteId: (routeId: number) => apiClient.get<RouteNode[]>(API_ENDPOINTS.routeNodes(routeId)),
  },
};
