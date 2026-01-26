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
    // Не используем envPrefix: '', так как это небезопасно
    // Все нужные переменные явно определены через define ниже
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
      'import.meta.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL || 'http://localhost:8000/api'),
      'import.meta.env.WS_BASE_URL': JSON.stringify(env.WS_BASE_URL || 'localhost:8000'),
      'import.meta.env.RECAPTCHA_SITE_KEY': JSON.stringify(env.VITE_RECAPTCHA_SITE_KEY || ''),
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