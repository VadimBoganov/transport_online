import { useState, useEffect, useRef, useCallback } from "react";
import { calculateViewportBounds, type ViewportBounds } from "@/services/viewport";

interface UseMapViewportProps {
    initialCenter: [number, number];
    initialZoom: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    debouncedOnBoundsChanged: (bounds: { center: [number, number]; zoom: number }) => void;
}

interface UseMapViewportResult {
    mapWidth: number;
    mapHeight: number;
    currentCenter: [number, number];
    currentZoom: number;
    viewportBounds: ViewportBounds;
    handleBoundsChanged: (params: { center: [number, number]; zoom: number }) => void;
}

export const useMapViewport = ({
    initialCenter,
    initialZoom,
    containerRef,
    debouncedOnBoundsChanged,
}: UseMapViewportProps): UseMapViewportResult => {
    const [mapWidth, setMapWidth] = useState(window.innerWidth);
    const [mapHeight, setMapHeight] = useState(window.innerHeight);
    const [currentCenter, setCurrentCenter] = useState<[number, number]>(initialCenter);
    const [currentZoom, setCurrentZoom] = useState<number>(initialZoom);

    const [viewportBounds, setViewportBounds] = useState(() =>
        calculateViewportBounds(initialCenter, initialZoom, window.innerWidth, window.innerHeight)
    );

    const boundsUpdateTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        setCurrentCenter(initialCenter);
        setCurrentZoom(initialZoom);
    }, [initialCenter, initialZoom]);

    const handleBoundsChanged = useCallback(
        ({ center, zoom }: { center: [number, number]; zoom: number }) => {
            setCurrentCenter(center);
            setCurrentZoom(zoom);

            if (boundsUpdateTimeoutRef.current !== null) {
                cancelAnimationFrame(boundsUpdateTimeoutRef.current);
            }

            boundsUpdateTimeoutRef.current = requestAnimationFrame(() => {
                const bounds = calculateViewportBounds(center, zoom, mapWidth, mapHeight);
                setViewportBounds(bounds);
                boundsUpdateTimeoutRef.current = null;
            });

            debouncedOnBoundsChanged({ center, zoom });
        },
        [debouncedOnBoundsChanged, mapWidth, mapHeight]
    );

    useEffect(() => {
        return () => {
            if (boundsUpdateTimeoutRef.current !== null) {
                cancelAnimationFrame(boundsUpdateTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMapWidth(rect.width);
                setMapHeight(rect.height);
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, [containerRef]);

    useEffect(() => {
        const bounds = calculateViewportBounds(currentCenter, currentZoom, mapWidth, mapHeight);
        setViewportBounds(bounds);
    }, [currentCenter, currentZoom, mapWidth, mapHeight]);

    return {
        mapWidth,
        mapHeight,
        currentCenter,
        currentZoom,
        viewportBounds,
        handleBoundsChanged,
    };
};
