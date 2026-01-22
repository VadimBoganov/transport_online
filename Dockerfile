# Multi-stage build для production

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Аргументы сборки для переменных окружения
ARG VITE_API_BASE_URL=http://localhost:8000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Копируем файлы зависимостей
COPY package.json package-lock.json ./

# Устанавливаем зависимости (без devDependencies для production)
RUN npm ci --omit=dev

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
