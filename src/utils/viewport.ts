import type { Animation } from "@/types/transport";
import { normalizeCoordinate } from "./coordinates";

/**
 * Преобразует координаты в пиксели для проекции Меркатора
 */
function latToY(lat: number): number {
    return Math.log(Math.tan((lat * Math.PI) / 180 + Math.PI / 4));
}

/**
 * Преобразует пиксели обратно в широту
 */
function yToLat(y: number): number {
    return (Math.atan(Math.exp(y)) - Math.PI / 4) * (180 / Math.PI) * 2;
}

/**
 * Вычисляет границы видимой области карты на основе центра, зума и размера карты
 * Использует точную формулу для проекции Меркатора
 */
export function calculateViewportBounds(
    center: [number, number],
    zoom: number,
    mapWidth: number,
    mapHeight?: number
): { north: number; south: number; east: number; west: number } {
    const height = mapHeight || (typeof window !== 'undefined' ? window.innerHeight : 768);
    
    // Размер тайла в пикселях (обычно 256)
    const tileSize = 256;
    
    // Количество пикселей на один градус долготы на экваторе
    const pixelsPerDegree = (tileSize * Math.pow(2, zoom)) / 360;
    
    // Вычисляем размер видимой области в градусах долготы
    const worldWidth = mapWidth / pixelsPerDegree;
    
    // Для широты используем проекцию Меркатора
    const centerLat = center[0];
    const centerLng = center[1];
    const centerY = latToY(centerLat);
    
    // Вычисляем размер в пикселях по вертикали
    const pixelsPerRad = (tileSize * Math.pow(2, zoom)) / (2 * Math.PI);
    const deltaY = height / (2 * pixelsPerRad);
    
    // Преобразуем обратно в градусы широты
    const northY = centerY + deltaY;
    const southY = centerY - deltaY;
    const north = yToLat(northY);
    const south = yToLat(southY);
    
    // Добавляем padding (30%) для более надежного определения видимой области
    const padding = 0.3;
    const latPadding = (north - south) * padding;
    const lngPadding = worldWidth * padding;
    
    return {
        north: north + latPadding,
        south: south - latPadding,
        east: centerLng + worldWidth / 2 + lngPadding,
        west: centerLng - worldWidth / 2 - lngPadding,
    };
}

/**
 * Проверяет, находится ли точка в видимой области
 */
function isPointInViewport(
    lat: number,
    lng: number,
    bounds: { north: number; south: number; east: number; west: number }
): boolean {
    // Проверка широты
    if (lat < bounds.south || lat > bounds.north) {
        return false;
    }
    
    // Проверка долготы (учитываем переход через 180/-180 меридиан)
    let lngInBounds: boolean;
    if (bounds.west <= bounds.east) {
        lngInBounds = lng >= bounds.west && lng <= bounds.east;
    } else {
        // Переход через меридиан
        lngInBounds = lng >= bounds.west || lng <= bounds.east;
    }
    
    return lngInBounds;
}

/**
 * Фильтрует транспортные средства, оставляя только видимые на экране
 * Всегда включает выбранное транспортное средство
 */
export function filterVisibleVehicles(
    vehicles: Animation[],
    bounds: { north: number; south: number; east: number; west: number },
    selectedVehicleId?: string,
    maxVisible: number = 500
): Animation[] {
    const result: Animation[] = [];
    let selectedVehicle: Animation | null = null;
    let visibleCount = 0;
    
    for (const vehicle of vehicles) {
        // Всегда показываем выбранное транспортное средство
        if (selectedVehicleId && vehicle.id === selectedVehicleId) {
            selectedVehicle = vehicle;
            continue;
        }
        
        // Ранний выход при достижении лимита
        if (visibleCount >= maxVisible) {
            continue;
        }
        
        // Нормализуем координаты для проверки (из микроградусов в градусы)
        const lat = normalizeCoordinate(vehicle.lat);
        const lng = normalizeCoordinate(vehicle.lon);
        
        if (isPointInViewport(lat, lng, bounds)) {
            result.push(vehicle);
            visibleCount++;
        }
    }
    
    // Добавляем выбранное транспортное средство в начало
    if (selectedVehicle) {
        result.unshift(selectedVehicle);
    }
    
    return result;
}
