import type { UseQueryResult } from "@tanstack/react-query";
import config from "@config";
import type { Route, RouteNode, SelectedRoute, TransportType } from "@/types/transport";
import { buildLineStringGeoJSON, type LineStringFeatureCollection } from "@/utils/geoJson";

export type RouteGeoJSON = LineStringFeatureCollection;

export interface RouteNodesMapResult {
    routeNodesMap: Map<number, RouteNode[]>;
    isLoading: boolean;
    error: boolean;
}

export const buildRouteNodesMap = (
    batchResults: UseQueryResult<RouteNode[], Error>[],
    selectedRoutes: Array<{ id: number }>
): RouteNodesMapResult => {
    const map = new Map<number, RouteNode[]>();
    let isLoading = false;
    let error = false;

    batchResults.forEach((result, index) => {
        const routeId = selectedRoutes[index]?.id;
        if (routeId === undefined) return;

        if (result.isLoading) isLoading = true;
        if (result.isError) error = true;

        if (result.data) {
            map.set(routeId, result.data);
        }
    });

    return { routeNodesMap: map, isLoading, error };
};


export const buildRouteGeoJSON = (
    routes: SelectedRoute[],
    routeNodesMap: Map<number, RouteNode[]>
): RouteGeoJSON | null => {
    const features = routes
        .map((route) => {
            const data = routeNodesMap.get(route.id);
            if (!data) return null;

            const color = config.routes.find(rt => rt.type === route.type)?.color || '#000000';
            return buildLineStringGeoJSON(data, color);
        })
        .filter((feature): feature is NonNullable<typeof feature> => feature !== null);

    return features.length > 0
        ? { type: "FeatureCollection" as const, features }
        : null;
};

export const getActiveRoutes = (
    selectedRoutes: SelectedRoute[],
    allRoutes: Route[]
): SelectedRoute[] => {
    return selectedRoutes.length > 0 ? selectedRoutes : allRoutes as SelectedRoute[];
};

export const makeRouteIdsString = (routes: SelectedRoute[]): string | null => {
    return routes.length > 0 ? routes.map(r => `${r.id}-0`).join(',') : null;
}

export const createRouteColorsMap = (): Map<string, string> => {
    const map = new Map<string, string>();
    config.routes.forEach(rt => {
        map.set(rt.type, rt.color);
    });
    return map;
};

export interface GroupedRoute {
    type: TransportType;
    title: string;
    routes: Route[][];
}

export const groupRoutesByType = (routes: Route[]): GroupedRoute[] => {
    const map = new Map<string, Route[]>();

    routes.forEach(route => {
        const key = `${route.num}-${route.type}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(route);
    });

    return config.routes.map(rtConfig => ({
        type: rtConfig.type,
        title: rtConfig.title,
        routes: Array.from(map.values()).filter(r => r[0].type === rtConfig.type)
    }));
};