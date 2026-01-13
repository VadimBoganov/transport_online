export const COORDINATE_SCALE = 1e6;

/**
 * Нормализует координату, преобразуя из микроградусов в градусы
 * @param value - значение координаты в микроградусах
 * @returns значение координаты в градусах
 */
export function normalizeCoordinate(value: number): number {
  return value / COORDINATE_SCALE;
}
