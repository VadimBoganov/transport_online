import { useEffect, useRef, useCallback } from "react";

interface VehiclePosition {
    lat: number;
    lon: number;
}

interface Vehicle {
    id: string;
    rtype: string;
    lat: number;
    lon: number;
}

interface CanvasAnimationState {
    target: VehiclePosition;
    current: VehiclePosition;
    startTime: number;
    startPosition: VehiclePosition;
}

/**
 * Hook for managing vehicle animations on canvas using RAF
 * Unlike useVehicleAnimations, this doesn't use React state for intermediate positions
 * to avoid triggering unnecessary re-renders
 */
export const useCanvasVehicleAnimations = (
    vehicles: Vehicle[], 
    duration = 2000,
    onAnimationFrame?: () => void
) => {
    const animationStates = useRef<Map<string, CanvasAnimationState>>(new Map());
    const animationFrameRef = useRef<number | null>(null);
    const hasActiveAnimationsRef = useRef(false);
    const onAnimationFrameRef = useRef(onAnimationFrame);

    // Update ref when callback changes
    useEffect(() => {
        onAnimationFrameRef.current = onAnimationFrame;
    }, [onAnimationFrame]);

    // Define animate before using it in useEffect
    const animate = useCallback(() => {
        const now = performance.now();
        let hasActiveAnimations = false;

        animationStates.current.forEach((state) => {
            const elapsed = now - state.startTime;
            const progress = Math.min(elapsed / duration, 1);

            if (progress < 1) {
                hasActiveAnimations = true;
                // Easing function (ease-in-out sine) - smooth start and end
                const easeProgress = -(Math.cos(Math.PI * progress) - 1) / 2;

                const currentLat =
                    state.startPosition.lat +
                    (state.target.lat - state.startPosition.lat) * easeProgress;
                const currentLon =
                    state.startPosition.lon +
                    (state.target.lon - state.startPosition.lon) * easeProgress;

                state.current = { lat: currentLat, lon: currentLon };
            } else {
                // Animation completed
                state.current = state.target;
            }
        });

        hasActiveAnimationsRef.current = hasActiveAnimations;

        // Notify parent that a frame needs to be rendered - use ref to get latest callback
        onAnimationFrameRef.current?.();

        if (hasActiveAnimations) {
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            animationFrameRef.current = null;
        }
    }, [duration]);

    // Update animation states when vehicles change
    useEffect(() => {
        const newStates = new Map<string, CanvasAnimationState>();
        const currentTime = performance.now();
        let hasNewAnimations = false;

        vehicles.forEach((vehicle) => {
            const key = `${vehicle.id}-${vehicle.rtype}`;
            const target = { lat: vehicle.lat, lon: vehicle.lon };
            const existingState = animationStates.current.get(key);

            if (!existingState) {
                // New marker - set immediately without animation
                newStates.set(key, {
                    target,
                    current: target,
                    startTime: currentTime,
                    startPosition: target,
                });
            } else {
                // Check if coordinates changed
                const targetChanged =
                    Math.abs(target.lat - existingState.target.lat) > 0.0001 ||
                    Math.abs(target.lon - existingState.target.lon) > 0.0001;

                if (targetChanged) {
                    // Start new animation from current position
                    hasNewAnimations = true;
                    newStates.set(key, {
                        target,
                        current: existingState.current,
                        startTime: currentTime,
                        startPosition: existingState.current,
                    });
                } else {
                    // Coordinates unchanged, continue existing animation
                    const elapsed = currentTime - existingState.startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    if (progress < 1) {
                        hasNewAnimations = true;
                    }
                    newStates.set(key, existingState);
                }
            }
        });

        animationStates.current = newStates;
        hasActiveAnimationsRef.current = hasNewAnimations;

        // Always restart animation loop if there are active animations or new animations
        if (hasNewAnimations || animationStates.current.size > 0) {
            // Cancel existing frame if any
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            // Start new animation loop
            animationFrameRef.current = requestAnimationFrame(animate);
        }
    }, [vehicles, duration, animate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    /**
     * Get current animated position for a vehicle
     */
    const getAnimatedPosition = useCallback((id: string, rtype: string): VehiclePosition | null => {
        const key = `${id}-${rtype}`;
        const state = animationStates.current.get(key);
        return state ? state.current : null;
    }, []);

    /**
     * Check if any animations are currently active
     */
    const hasActiveAnimations = useCallback(() => {
        return hasActiveAnimationsRef.current;
    }, []);

    return {
        animationStates,
        getAnimatedPosition,
        hasActiveAnimations,
    };
};