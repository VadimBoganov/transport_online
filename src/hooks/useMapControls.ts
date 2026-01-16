import { useState, useEffect, useCallback, useRef } from "react";

export interface MapBounds {
    ne: [number, number];
    sw: [number, number];
}

export const useMapControls = (
    onCenterChange?: (center: [number, number], zoom: number) => void,
    debounceDelay: number = 100
) => {
    const [mapWidth, setMapWidth] = useState<number>(1024);
    const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleResize = () => setMapWidth(window.innerWidth);
            handleResize();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const debouncedOnBoundsChanged = useCallback(
        ({ center, zoom, bounds }: { 
            center: [number, number]; 
            zoom: number;
            bounds?: { ne: [number, number]; sw: [number, number] };
        }) => {
            if (bounds) {
                setMapBounds({ ne: bounds.ne, sw: bounds.sw });
            }
            
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            
            timeoutRef.current = setTimeout(() => {
                onCenterChange?.(center, zoom);
            }, debounceDelay);
        },
        [onCenterChange, debounceDelay]
    );

    return {
        mapWidth,
        mapBounds,
        debouncedOnBoundsChanged,
    };
};
