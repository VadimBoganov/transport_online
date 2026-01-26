interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  ttl: number;
}

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

class TokenService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private accessExpiresAt: number = 0;
  private refreshExpiresAt: number = 0;
  private refreshPromise: Promise<string> | null = null;

  async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessExpiresAt - 60000) {
      return this.accessToken;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (this.refreshToken && Date.now() < this.refreshExpiresAt) {
      this.refreshPromise = this.refreshAccessToken();
    } else {
      this.refreshPromise = this.fetchToken();
    }

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async fetchToken(): Promise<string> {
    const API_BASE_URL = import.meta.env.API_BASE_URL || 'http://localhost:8000/api';
    const recaptchaToken = await this.getRecaptchaToken();

    const url = new URL(`${API_BASE_URL}/auth/token`);
    if (recaptchaToken) {
      url.searchParams.set('recaptcha_token', recaptchaToken);
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.statusText}`);
      }

      const data: TokenResponse = await response.json();

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.accessExpiresAt = data.expires_at * 1000;
      this.refreshExpiresAt = data.expires_at * 1000 + (14 * 24 * 60 * 60 * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Error fetching token:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      return this.fetchToken();
    }

    const API_BASE_URL = import.meta.env.API_BASE_URL || 'http://localhost:8000/api';

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        this.refreshToken = null;
        return this.fetchToken();
      }

      const data: TokenResponse = await response.json();

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.accessExpiresAt = data.expires_at * 1000;
      this.refreshExpiresAt = data.expires_at * 1000 + (14 * 24 * 60 * 60 * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.refreshToken = null;
      this.refreshExpiresAt = 0;
      return this.fetchToken();
    }
  }

  private async getRecaptchaToken(): Promise<string | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      return null;
    }

    if (!window.grecaptcha) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (window.grecaptcha) {
            clearInterval(checkInterval);
            window.grecaptcha.ready(() => {
              window.grecaptcha!
                .execute(siteKey, { action: 'get_token' })
                .then(resolve)
                .catch(() => resolve(null));
            });
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 5000);
      });
    }

    try {
      return await new Promise<string | null>((resolve) => {
        window.grecaptcha!.ready(() => {
          window
            .grecaptcha!.execute(siteKey, { action: 'get_token' })
            .then(resolve)
            .catch(() => resolve(null));
        });
      });
    } catch (error) {
      console.warn('reCAPTCHA error:', error);
      return null;
    }
  }

  clearToken(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.accessExpiresAt = 0;
    this.refreshExpiresAt = 0;
  }

  hasValidToken(): boolean {
    return this.accessToken !== null && Date.now() < this.accessExpiresAt;
  }
}

export const tokenService = new TokenService();
