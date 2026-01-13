import { useState, useEffect, useCallback } from "react";

export const useMapControls = (
    onCenterChange?: (center: [number, number], zoom: number) => void,
    debounceDelay: number = 100
) => {
    const [mapWidth, setMapWidth] = useState<number>(1024);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleResize = () => setMapWidth(window.innerWidth);
            handleResize();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    const debouncedOnBoundsChanged = useCallback(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        return ({ center, zoom }: { center: [number, number]; zoom: number }) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                onCenterChange?.(center, zoom);
            }, debounceDelay);
        };
    }, [onCenterChange, debounceDelay]);

    return {
        mapWidth,
        debouncedOnBoundsChanged,
    };
};
