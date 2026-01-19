import { useCallback } from "react";
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
        (e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            
            // Получаем данные из data-атрибутов элемента
            const target = e.currentTarget;
            const rid = Number(target.dataset.rid);
            const id = target.dataset.id!;
            const rtype = target.dataset.rtype as TransportType;

            closeStationPopup();
            onStationDeselect();

            if (selectedVehicle?.id === id) {
                setSelectedVehicle(null);
            } else {
                setSelectedVehicle({ id, rid, rtype });
            }
        },
        [selectedVehicle, setSelectedVehicle, onStationDeselect, closeStationPopup]
    );

    return { handleVehicleClick };
};
