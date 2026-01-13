import { useState, useCallback } from "react";
import type { SelectedRoute, SelectedStation, SelectedVehicle } from "@/types/transport";

export interface MapSelection {
    selectedStation: SelectedStation | null;
    selectedVehicle: SelectedVehicle | null;
    selectedRoutes: SelectedRoute[];
}

export function useMapState() {
    const [selection, setSelection] = useState<MapSelection>({
        selectedStation: null,
        selectedVehicle: null,
        selectedRoutes: [],
    });

    const setSelectedStation = useCallback((station: SelectedStation | null) => {
        setSelection(prev => ({
            ...prev,
            selectedStation: station,
            selectedVehicle: station ? null : prev.selectedVehicle,
        }));
    }, []);

    const setSelectedVehicle = useCallback((vehicle: SelectedVehicle | null) => {
        setSelection(prev => ({
            ...prev,
            selectedVehicle: vehicle,
        }));
    }, []);

    const setSelectedRoutes = useCallback((routes: SelectedRoute[]) => {
        setSelection(prev => ({
            ...prev,
            selectedRoutes: routes,
            selectedStation: null,
            selectedVehicle: null,
        }));
    }, []);

    const resetAll = useCallback(() => {
        setSelection({
            selectedStation: null,
            selectedVehicle: null,
            selectedRoutes: [],
        });
    }, []);

    return {
        ...selection,
        setSelectedStation,
        setSelectedVehicle,
        setSelectedRoutes,
        resetAll,
    };
}
