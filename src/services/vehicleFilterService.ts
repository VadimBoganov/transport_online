import type { Animation } from "@/hooks/useVehiclePositions";
import type { SelectedRoute } from "@/components/MapContainer/MapContainer"; // или определите локально

export const filterVehiclesBySelectedRoutes = (
    vehicles: Animation[] | undefined,
    selectedRoutes: SelectedRoute[]
): Animation[] => {
    if (!vehicles) return [];

    if (selectedRoutes.length === 0) return vehicles;

    const selectedRouteIds = new Set(selectedRoutes.map(r => r.id));
    return vehicles.filter(anim => selectedRouteIds.has(anim.rid));
};
