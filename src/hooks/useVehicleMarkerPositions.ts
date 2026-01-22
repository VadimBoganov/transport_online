import { useMemo } from "react";
import type { Animation } from "@/types/transport";
import { MARKER_RADIUS, SELECTED_MARKER_SCALE } from "@/services/vehicleCanvasService";
import type { RefObject } from "react";

interface AnimationState {
    current: {
        lat: number;
        lon: number;
    };
}

interface UseVehicleMarkerPositionsProps {
    vehicles: Animation[];
    animationStates: RefObject<Map<string, AnimationState>>;
    latLngToPixel?: (latLng: [number, number]) => [number, number];
    selectedVehicleId: string | null;
    dimensions: { width: number; height: number };
}

export interface MarkerPosition {
    vehicle: Animation;
    x: number;
    y: number;
    radius: number;
    visible: boolean;
}

export const useVehicleMarkerPositions = ({
    vehicles,
    animationStates,
    latLngToPixel,
    selectedVehicleId,
    dimensions,
}: UseVehicleMarkerPositionsProps): MarkerPosition[] => {
    return useMemo(() => {
        if (!latLngToPixel) return [];

        return vehicles
            .map((vehicle) => {
                const key = `${vehicle.id}-${vehicle.rtype}`;
                const animState = animationStates.current?.get(key);

                let lat = animState ? animState.current.lat : vehicle.lat;
                let lon = animState ? animState.current.lon : vehicle.lon;

                lat = lat / 1000000;
                lon = lon / 1000000;

                const { width, height } = dimensions;
                const [x, y] = latLngToPixel([lat, lon]);

                const isSelected = vehicle.id === selectedVehicleId;
                const radius = MARKER_RADIUS * (isSelected ? SELECTED_MARKER_SCALE : 1) + 4;

                return {
                    vehicle,
                    x,
                    y,
                    radius,
                    visible: x >= -50 && x <= width + 50 && y >= -50 && y <= height + 50,
                };
            })
            .filter((pos) => pos.visible);
    }, [vehicles, animationStates, latLngToPixel, selectedVehicleId, dimensions]);
};
