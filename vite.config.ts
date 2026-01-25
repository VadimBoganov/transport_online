/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения из .env файла
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    envPrefix: '', // Загружаем все переменные без префикса
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@config': path.resolve(__dirname, './config.ts'),
        '@tests': path.resolve(__dirname, './src/tests'),
        '@types': path.resolve(__dirname, './src/types'),
      },
    },
    define: {
      // Экспортируем переменные окружения без префикса VITE_
      'import.meta.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL || 'http://localhost:8000/api'),
      // Протокол (ws:// или wss://) определяется автоматически на основе протокола страницы
      'import.meta.env.WS_BASE_URL': JSON.stringify(env.WS_BASE_URL || 'localhost:8000'),
      'import.meta.env.REST_SECRET_KEY': JSON.stringify(env.REST_SECRET_KEY || ''),
      'import.meta.env.WS_SECRET_KEY': JSON.stringify(env.WS_SECRET_KEY || ''),
    },
    test: {
      environment: 'jsdom', 
      globals: true,        
      setupFiles: './src/tests/setup.ts', 
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: [
        'node_modules',
        'dist',
        '.idea',
        '.git',
        '.cache',
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'clover', 'json'],
        reportsDirectory: './coverage',
        exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
      },
    },
  };
});