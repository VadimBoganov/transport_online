import { useRef, useEffect, useCallback } from "react";
import type { Animation } from "@/types/transport";
import { drawMarker } from "@/services/vehicleCanvasService";
import type { RefObject } from "react";

interface AnimationState {
    current: {
        lat: number;
        lon: number;
    };
}

interface UseVehicleCanvasRenderProps {
    canvasRef: RefObject<HTMLCanvasElement | null>;
    vehicles: Animation[];
    animationStates: RefObject<Map<string, AnimationState>>;
    selectedVehicleId: string | null;
    routeColorsMap: Map<string, string>;
    latLngToPixel?: (latLng: [number, number]) => [number, number];
    dimensions: { width: number; height: number };
    hasActiveAnimations: () => boolean;
}

export const useVehicleCanvasRender = ({
    canvasRef,
    vehicles,
    animationStates,
    selectedVehicleId,
    routeColorsMap,
    latLngToPixel,
    dimensions,
    hasActiveAnimations,
}: UseVehicleCanvasRenderProps): (() => void) => {
    const redrawRequestedRef = useRef(false);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !latLngToPixel) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const { width, height } = dimensions;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);

        const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
        const otherVehicles = vehicles.filter((v) => v.id !== selectedVehicleId);

        [...otherVehicles, ...(selectedVehicle ? [selectedVehicle] : [])].forEach((vehicle) => {
            const key = `${vehicle.id}-${vehicle.rtype}`;
            const animState = animationStates.current?.get(key);

            let lat = animState ? animState.current.lat : vehicle.lat;
            let lon = animState ? animState.current.lon : vehicle.lon;

            lat = lat / 1000000;
            lon = lon / 1000000;

            const [x, y] = latLngToPixel([lat, lon]);

            if (x < -50 || x > width + 50 || y < -50 || y > height + 50) {
                return;
            }

            const isSelected = vehicle.id === selectedVehicleId;
            const routeColor = routeColorsMap.get(vehicle.rtype) || "gray";
            drawMarker({
                ctx,
                vehicle,
                x,
                y,
                isSelected,
                routeColor,
            });
        });

        redrawRequestedRef.current = false;
    }, [vehicles, animationStates, dimensions, selectedVehicleId, routeColorsMap, latLngToPixel, canvasRef]);

    useEffect(() => {
        render();
    }, [render]);

    useEffect(() => {
        let rafId: number;

        const renderLoop = () => {
            if (redrawRequestedRef.current || hasActiveAnimations()) {
                render();
            }
            rafId = requestAnimationFrame(renderLoop);
        };

        rafId = requestAnimationFrame(renderLoop);

        return () => {
            cancelAnimationFrame(rafId);
        };
    }, [render, hasActiveAnimations]);

    const handleAnimationFrame = useCallback(() => {
        redrawRequestedRef.current = true;
    }, []);

    return handleAnimationFrame;
};
