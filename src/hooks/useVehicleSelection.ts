import { useCallback, startTransition } from "react";
import type { SelectedVehicle, TransportType } from "@/types/transport";

interface UseVehicleSelectionProps {
    selectedVehicle: SelectedVehicle | null;
    setSelectedVehicle: (vehicle: SelectedVehicle | null) => void;
    onStationDeselect: () => void;
    closeStationPopup: () => void;
}

export const useVehicleSelection = ({
    selectedVehicle,
    setSelectedVehicle,
    onStationDeselect,
    closeStationPopup,
}: UseVehicleSelectionProps) => {
    const handleVehicleClick = useCallback(
        (rid: number, id: string, rtype: TransportType) =>
            (e: React.MouseEvent) => {
                e.stopPropagation();

                closeStationPopup();
                onStationDeselect();

                if (selectedVehicle?.id === id) {
                    setSelectedVehicle(null);
                } else {
                    setSelectedVehicle({ id, rid, rtype  });
                }
            },
        [selectedVehicle, setSelectedVehicle, onStationDeselect, closeStationPopup]
    );

    return { handleVehicleClick };
};
