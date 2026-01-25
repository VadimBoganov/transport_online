/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly API_BASE_URL?: string
  readonly WS_BASE_URL?: string
  // Секретные ключи больше не используются - используем токены
}
