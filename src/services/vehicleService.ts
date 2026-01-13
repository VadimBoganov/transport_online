import type { Animation, RouteNode, SelectedRoute } from "@/types/transport";
import config from "@config";
import { normalizeCoordinate } from "@/utils/coordinates";

export interface SelectedVehicleGeoJSON {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        geometry: {
            type: "LineString";
            coordinates: [number, number][];
        };
        properties: { stroke: string };
    }>;
}

export const buildSelectedVehicleGeoJSON = (
    selectedVehicle: { rid: number; rtype: string } | null,
    routeNodes: RouteNode[] | undefined
): SelectedVehicleGeoJSON | null => {
    if (!selectedVehicle || !routeNodes || routeNodes.length <= 1) {
        return null;
    }

    const color = config.routes.find(rt => rt.type === selectedVehicle.rtype)?.color || 'gray';

    return {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: routeNodes.map(node => [normalizeCoordinate(node.lng), normalizeCoordinate(node.lat)]) as [number, number][],
                },
                properties: { stroke: color },
            },
        ],
    };
};

export const filterVehiclesBySelectedRoutes = (
    vehicles: Animation[] | undefined,
    selectedRoutes: SelectedRoute[]
): Animation[] => {
    if (!vehicles) return [];

    if (selectedRoutes.length === 0) return vehicles;

    const selectedRouteIds = new Set(selectedRoutes.map(r => r.id));
    return vehicles.filter(anim => selectedRouteIds.has(anim.rid));
};
