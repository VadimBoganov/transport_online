# Multi-stage build для production

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Аргументы сборки для переменных окружения // must have
ARG API_BASE_URL=http://localhost:8000/api
ENV API_BASE_URL=$API_BASE_URL

ARG WS_BASE_URL=localhost:8000
ENV WS_BASE_URL=$WS_BASE_URL

# Копируем файлы зависимостей
COPY package.json package-lock.json ./

# Устанавливаем все зависимости (dev-зависимости нужны только на этапе сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Копируем собранные файлы из builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
