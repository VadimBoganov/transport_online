import type { UseQueryResult } from "@tanstack/react-query";
import config from "@config";
import type { Route, RouteNode, SelectedRoute } from "@/types/transport";

export interface RouteGeoJSON {
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
            if (!data || data.length < 2) return null;

            const color = config.routes.find(rt => rt.type === route.type)?.color || '#000000';

            return {
                type: "Feature" as const,
                geometry: {
                    type: "LineString" as const,
                    coordinates: data.map(node => [node.lng / 1e6, node.lat / 1e6]) as [number, number][],
                },
                properties: { stroke: color },
            };
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
