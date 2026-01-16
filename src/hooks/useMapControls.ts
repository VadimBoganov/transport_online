import { useState, useEffect, useCallback } from "react";
import { calculateViewportBounds } from "@/utils/viewport";

export interface ViewportBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

export const useMapControls = (
    onCenterChange?: (center: [number, number], zoom: number) => void,
    initialCenter?: [number, number],
    initialZoom?: number,
    debounceDelay: number = 100
) => {
    const [mapWidth, setMapWidth] = useState<number>(1024);
    const [mapHeight, setMapHeight] = useState<number>(768);
    const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);
    const [currentCenter, setCurrentCenter] = useState<[number, number] | null>(initialCenter || null);
    const [currentZoom, setCurrentZoom] = useState<number | null>(initialZoom ?? null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleResize = () => {
                setMapWidth(window.innerWidth);
                setMapHeight(window.innerHeight);
            };
            handleResize();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    // Инициализируем viewport bounds при первой загрузке
    useEffect(() => {
        if (initialCenter && initialZoom !== undefined && !viewportBounds) {
            const bounds = calculateViewportBounds(initialCenter, initialZoom, mapWidth, mapHeight);
            setViewportBounds(bounds);
            setCurrentCenter(initialCenter);
            setCurrentZoom(initialZoom);
        }
    }, [initialCenter, initialZoom, mapWidth, mapHeight, viewportBounds]);

    // Обновляем границы при изменении центра, зума или размера карты
    useEffect(() => {
        if (currentCenter && currentZoom !== null) {
            const bounds = calculateViewportBounds(currentCenter, currentZoom, mapWidth, mapHeight);
            setViewportBounds(bounds);
        }
    }, [currentCenter, currentZoom, mapWidth, mapHeight]);

    const debouncedOnBoundsChanged = useCallback(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        return ({ center, zoom }: { center: [number, number]; zoom: number }) => {
            // Обновляем состояние сразу для быстрой фильтрации
            setCurrentCenter(center);
            setCurrentZoom(zoom);
            
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                onCenterChange?.(center, zoom);
            }, debounceDelay);
        };
    }, [onCenterChange, debounceDelay]);

    return {
        mapWidth,
        debouncedOnBoundsChanged,
        viewportBounds,
    };
};
