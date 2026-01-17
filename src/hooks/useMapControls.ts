import { useState, useEffect, useCallback } from "react";

export interface MapBounds {
    ne: [number, number];
    sw: [number, number];
}

export const useMapControls = (
    _onCenterChange?: (center: [number, number], zoom: number) => void,
    _debounceDelay: number = 100
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

    const debouncedOnBoundsChanged = useCallback(
        ({ bounds }: { 
            center: [number, number]; 
            zoom: number;
            bounds?: { ne: [number, number]; sw: [number, number] };
        }) => {
            if (bounds) {
                setMapBounds({ ne: bounds.ne, sw: bounds.sw });
            }
        },
        []
    );

    return {
        mapWidth,
        mapBounds,
        debouncedOnBoundsChanged,
    };
};
