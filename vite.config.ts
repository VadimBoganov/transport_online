/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@config': path.resolve(__dirname, './config.ts'),
      '@tests': path.resolve(__dirname, './src/tests'),
      '@types': path.resolve(__dirname, './src/types'),
    },
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
});