import { useCallback } from "react";
import type { SelectedVehicle, TransportType } from "@/types/transport";

interface UseVehicleSelectionProps {
    selectedVehicle: SelectedVehicle | null;
    setSelectedVehicle: (vehicle: SelectedVehicle | null) => void;
    onStationDeselect: () => void;
}

export const useVehicleSelection = ({
    selectedVehicle,
    setSelectedVehicle,
    onStationDeselect,
}: UseVehicleSelectionProps) => {
    const handleVehicleClick = useCallback(
        (rid: number, id: string, rtype: TransportType) =>
            (e: React.MouseEvent) => {
                e.stopPropagation();

                if (selectedVehicle?.id === id) {
                    setSelectedVehicle(null);
                    onStationDeselect();
                } else {
                    setSelectedVehicle({ id, rid, rtype  });
                }
            },
        [selectedVehicle, setSelectedVehicle, onStationDeselect]
    );

    return { handleVehicleClick };
};
