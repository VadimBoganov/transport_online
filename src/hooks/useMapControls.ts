import { useState, useCallback } from "react";

export interface MapSelection {
    selectedStation: { id: number; name: string; lat: number; lng: number } | null;
    selectedVehicle: { id: string; rid: number, rtype: string } | null;
    selectedRoutes: Array<{ id: number; type: "А" | "Т" | "М" }>;
}

export function useMapControls() {
    const [selection, setSelection] = useState<MapSelection>({
        selectedStation: null,
        selectedVehicle: null,
        selectedRoutes: [],
    });

    const setSelectedStation = useCallback((station: MapSelection['selectedStation']) => {
        setSelection(prev => ({
            ...prev,
            selectedStation: station,
            selectedVehicle: station ? null : prev.selectedVehicle,
        }));
    }, []);

    const setSelectedVehicle = useCallback((vehicle: MapSelection['selectedVehicle']) => {
        setSelection(prev => ({
            ...prev,
            selectedVehicle: vehicle,
        }));
    }, []);

    const setSelectedRoutes = useCallback((routes: MapSelection['selectedRoutes']) => {
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
