import { ApiClientError } from "@/api/client";

export function getErrorMessage(error: unknown, fallback = "Произошла ошибка при загрузке данных"): string {
  if (error instanceof ApiClientError) {
    if (error.status === 0) {
      return "Не удалось подключиться к серверу. Проверьте интернет-соединение.";
    }

    return `Ошибка сервера (${error.status}): ${error.message || error.statusText}`;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

