import type { Animation, RouteNode, SelectedRoute, SelectedVehicle } from "@/types/transport";
import config from "@config";
import { buildLineStringGeoJSON, type LineStringFeatureCollection } from "@/utils/geoJson";
import { isPointInViewport, type ViewportBounds } from "./viewport";

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

export const filterVisibleVehicles = (
    vehicles: Animation[],
    viewportBounds: ViewportBounds,
    selectedVehicle: SelectedVehicle | null
): Animation[] => {
    if (vehicles.length === 0) return vehicles;

    return vehicles.filter((anim) => {
        if (selectedVehicle?.id === anim.id) return true;
        return isPointInViewport(anim.lat, anim.lon, viewportBounds);
    });
};

export const limitRenderedVehicles = (
    vehicles: Animation[],
    zoom: number
): Animation[] => {
    if (zoom < 12) {
        return vehicles.slice(0, 150);
    }
    if (zoom < 14) {
        return vehicles.slice(0, 300);
    }
    return vehicles.slice(0, 500);
};
