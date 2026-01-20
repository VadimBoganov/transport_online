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

    // Update animation states when vehicles change
    useEffect(() => {
        const newStates = new Map<string, CanvasAnimationState>();
        const currentTime = performance.now();

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
                    newStates.set(key, {
                        target,
                        current: existingState.current,
                        startTime: currentTime,
                        startPosition: existingState.current,
                    });
                } else {
                    // Coordinates unchanged, continue existing animation
                    newStates.set(key, existingState);
                }
            }
        });

        animationStates.current = newStates;

        // Start animation loop if not already running
        if (animationFrameRef.current === null) {
            animationFrameRef.current = requestAnimationFrame(animate);
        }
    }, [vehicles, duration]);

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

        // Notify parent that a frame needs to be rendered
        onAnimationFrame?.();

        if (hasActiveAnimations) {
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            animationFrameRef.current = null;
        }
    }, [duration, onAnimationFrame]);

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
