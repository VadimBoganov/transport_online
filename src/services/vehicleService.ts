import type { Animation, RouteNode, SelectedRoute } from "@/types/transport";
import config from "@config";
import { buildLineStringGeoJSON, type LineStringFeatureCollection } from "@/utils/geoJson";

export type SelectedVehicleGeoJSON = LineStringFeatureCollection;

export const buildSelectedVehicleGeoJSON = (
    selectedVehicle: { rid: number; rtype: string } | null,
    routeNodes: RouteNode[] | undefined
): SelectedVehicleGeoJSON | null => {
    if (!selectedVehicle || !routeNodes) {
        return null;
    }

    const color = config.routes.find(rt => rt.type === selectedVehicle.rtype)?.color || 'gray';
    const feature = buildLineStringGeoJSON(routeNodes, color);

    if (!feature) {
        return null;
    }

    return {
        type: "FeatureCollection",
        features: [feature],
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
