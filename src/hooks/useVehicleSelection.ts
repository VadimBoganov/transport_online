import type { SelectedVehicle, TransportType } from "@/types/transport";
import { useCallback } from "react";

interface UseVehicleSelectionParams {
    selectedVehicle: SelectedVehicle | null;
    setSelectedVehicle: (v: SelectedVehicle | null) => void;
    onStationDeselect: () => void;
}

export const useVehicleSelection = ({
    selectedVehicle,
    setSelectedVehicle,
    onStationDeselect: onDeselectStation,
}: UseVehicleSelectionParams) => {
    const handleVehicleClick = useCallback((rid: number, id: string, rtype: TransportType) => (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeselectStation?.();
        setSelectedVehicle(selectedVehicle?.rid === rid ? null : { rid, id, rtype });
    }, [onDeselectStation, setSelectedVehicle]);

    return { handleVehicleClick };
};
