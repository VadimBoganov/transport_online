import { useEffect, useRef, useState } from "react";

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

interface AnimationState {
    target: VehiclePosition;
    current: VehiclePosition;
    startTime: number;
    startPosition: VehiclePosition;
}

export const useVehicleAnimations = (vehicles: Vehicle[], duration = 2000) => {
    const [animatedPositions, setAnimatedPositions] = useState<Map<string, VehiclePosition>>(new Map());
    const animationStates = useRef<Map<string, AnimationState>>(new Map());
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const newStates = new Map<string, AnimationState>();
        const currentTime = performance.now();

        vehicles.forEach((vehicle) => {
            const key = `${vehicle.id}-${vehicle.rtype}`;
            const target = { lat: vehicle.lat, lon: vehicle.lon };
            const existingState = animationStates.current.get(key);

            if (!existingState) {
                // Новый маркер - устанавливаем сразу
                newStates.set(key, {
                    target,
                    current: target,
                    startTime: currentTime,
                    startPosition: target,
                });
            } else {
                // Проверяем, изменились ли координаты
                const targetChanged =
                    Math.abs(target.lat - existingState.target.lat) > 0.0001 ||
                    Math.abs(target.lon - existingState.target.lon) > 0.0001;

                if (targetChanged) {
                    // Начинаем новую анимацию с текущей позиции
                    newStates.set(key, {
                        target,
                        current: existingState.current,
                        startTime: currentTime,
                        startPosition: existingState.current,
                    });
                } else {
                    // Координаты не изменились, продолжаем существующую анимацию
                    newStates.set(key, existingState);
                }
            }
        });

        animationStates.current = newStates;

        const animate = () => {
            const now = performance.now();
            const updatedPositions = new Map<string, VehiclePosition>();
            let hasActiveAnimations = false;

            animationStates.current.forEach((state, key) => {
                const elapsed = now - state.startTime;
                const progress = Math.min(elapsed / duration, 1);

                if (progress < 1) {
                    hasActiveAnimations = true;
                    // Easing function (ease-in-out sine) - максимально плавное начало и конец
                    const easeProgress = -(Math.cos(Math.PI * progress) - 1) / 2;

                    const currentLat =
                        state.startPosition.lat +
                        (state.target.lat - state.startPosition.lat) * easeProgress;
                    const currentLon =
                        state.startPosition.lon +
                        (state.target.lon - state.startPosition.lon) * easeProgress;

                    updatedPositions.set(key, { lat: currentLat, lon: currentLon });
                    state.current = { lat: currentLat, lon: currentLon };
                } else {
                    // Анимация завершена
                    updatedPositions.set(key, state.target);
                    state.current = state.target;
                }
            });

            setAnimatedPositions(updatedPositions);

            if (hasActiveAnimations) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                animationFrameRef.current = null;
            }
        };

        // Запускаем анимацию
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [vehicles, duration]);

    return animatedPositions;
};
