import { useCallback } from "react";
import type { TransportType, SelectedVehicle } from "@/types/transport";
import { normalizeCoordinate } from "@/utils/coordinates";

interface UseMapInteractionsProps {
    selectedVehicle: SelectedVehicle | null;
    setSelectedVehicle: (vehicle: SelectedVehicle | null) => void;
    onStationDeselect: () => void;
    closeStationPopup: () => void;
    onCenterChange?: (center: [number, number], zoom: number) => void;
    currentZoom: number;
    openForecastStationPopup: (station: { id: number; name: string; lat: number; lng: number }) => void;
}

interface UseMapInteractionsResult {
    handleVehicleClick: (vehicle: { id: string; rid: number; rtype: string }) => void;
    handleForecastClick: (e: React.MouseEvent<HTMLElement>) => void;
}

export const useMapInteractions = ({
    selectedVehicle,
    setSelectedVehicle,
    onStationDeselect,
    closeStationPopup,
    onCenterChange,
    currentZoom,
    openForecastStationPopup,
}: UseMapInteractionsProps): UseMapInteractionsResult => {
    const handleVehicleClick = useCallback(
        (vehicle: { id: string; rid: number; rtype: string }) => {
            closeStationPopup();
            onStationDeselect();

            if (selectedVehicle?.id === vehicle.id) {
                setSelectedVehicle(null);
            } else {
                setSelectedVehicle({
                    id: vehicle.id,
                    rid: vehicle.rid,
                    rtype: vehicle.rtype as TransportType,
                });
            }
        },
        [selectedVehicle, setSelectedVehicle, onStationDeselect, closeStationPopup]
    );

    const handleForecastClick = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation();

            const target = e.currentTarget;
            const stid = Number(target.dataset.stid);
            const stname = target.dataset.stname!;
            const lat0 = Number(target.dataset.lat0);
            const lng0 = Number(target.dataset.lng0);

            onStationDeselect();
            onCenterChange?.([normalizeCoordinate(lat0), normalizeCoordinate(lng0)], currentZoom);
            openForecastStationPopup({
                id: stid,
                name: stname,
                lat: lat0,
                lng: lng0,
            });
        },
        [onStationDeselect, onCenterChange, currentZoom, openForecastStationPopup]
    );

    return {
        handleVehicleClick,
        handleForecastClick,
    };
};
