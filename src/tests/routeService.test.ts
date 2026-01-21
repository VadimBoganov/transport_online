import { describe, it, expect } from "vitest";
import {
    buildRouteGeoJSON,
    buildRouteNodesMap,
    getActiveRoutes,
    makeRouteIdsString
} from "@/services/routeService";
import type { SelectedRoute, Route, RouteNode } from "@/types/transport";
import type { UseQueryResult } from "@tanstack/react-query";

describe("routeService", () => {
    describe("buildRouteGeoJSON", () => {
        const routeNodesMap = new Map([
            [1, [{ lat: 60000000, lng: 30000000 }, { lat: 60100000, lng: 30100000 }]]
        ]);

        const routes = [{ id: 1, type: "А" }] as SelectedRoute[];

        it("should build valid GeoJSON for routes", () => {
            const result = buildRouteGeoJSON(routes, routeNodesMap);

            expect(result).toEqual({
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "LineString",
                            coordinates: [[30, 60], [30.1, 60.1]]
                        },
                        properties: { stroke: expect.any(String) }
                    }
                ]
            });
        });

        it("should return null for empty routes", () => {
            const result = buildRouteGeoJSON([], routeNodesMap);
            expect(result).toBeNull();
        });

        it("should skip routes without nodes data", () => {
            const multipleRoutes = [
                { id: 1, type: "А" },
                { id: 2, type: "Т" }
            ] as SelectedRoute[];

            const result = buildRouteGeoJSON(multipleRoutes, routeNodesMap);

            expect(result?.features).toHaveLength(1);
        });

        it("should handle multiple routes with data", () => {
            const multipleRoutesMap = new Map([
                [1, [{ lat: 60000000, lng: 30000000 }, { lat: 60100000, lng: 30100000 }]],
                [2, [{ lat: 61000000, lng: 31000000 }, { lat: 61100000, lng: 31100000 }]]
            ]);

            const multipleRoutes = [
                { id: 1, type: "А" },
                { id: 2, type: "Т" }
            ] as SelectedRoute[];

            const result = buildRouteGeoJSON(multipleRoutes, multipleRoutesMap);

            expect(result?.features).toHaveLength(2);
        });

        it("should use correct color from config", () => {
            const result = buildRouteGeoJSON(routes, routeNodesMap);

            expect(result?.features[0].properties?.stroke).toBeDefined();
            expect(typeof result?.features[0].properties?.stroke).toBe("string");
        });
    });

    describe("buildRouteNodesMap", () => {
        const mockRouteNodes: RouteNode[] = [
            { lat: 60000000, lng: 30000000 },
            { lat: 60100000, lng: 30100000 }
        ];

        it("should build route nodes map from batch results", () => {
            const batchResults = [
                { data: mockRouteNodes, isLoading: false, isError: false },
                { data: undefined, isLoading: true, isError: false }
            ] as UseQueryResult<RouteNode[], Error>[];

            const selectedRoutes = [{ id: 1 }, { id: 2 }];

            const result = buildRouteNodesMap(batchResults, selectedRoutes);

            expect(result.routeNodesMap.size).toBe(1);
            expect(result.routeNodesMap.get(1)).toEqual(mockRouteNodes);
            expect(result.isLoading).toBe(true);
            expect(result.error).toBe(false);
        });

        it("should detect loading state", () => {
            const batchResults = [
                { data: undefined, isLoading: true, isError: false }
            ] as UseQueryResult<RouteNode[], Error>[];

            const selectedRoutes = [{ id: 1 }];

            const result = buildRouteNodesMap(batchResults, selectedRoutes);

            expect(result.isLoading).toBe(true);
        });

        it("should detect error state", () => {
            const batchResults = [
                { data: undefined, isLoading: false, isError: true }
            ] as UseQueryResult<RouteNode[], Error>[];

            const selectedRoutes = [{ id: 1 }];

            const result = buildRouteNodesMap(batchResults, selectedRoutes);

            expect(result.error).toBe(true);
        });

        it("should handle empty batch results", () => {
            const result = buildRouteNodesMap([], []);

            expect(result.routeNodesMap.size).toBe(0);
            expect(result.isLoading).toBe(false);
            expect(result.error).toBe(false);
        });

        it("should skip results without route id", () => {
            const batchResults = [
                { data: mockRouteNodes, isLoading: false, isError: false }
            ] as UseQueryResult<RouteNode[], Error>[];

            const selectedRoutes: Array<{ id: number }> = [];

            const result = buildRouteNodesMap(batchResults, selectedRoutes);

            expect(result.routeNodesMap.size).toBe(0);
        });
    });

    describe("getActiveRoutes", () => {
        const allRoutes: Route[] = [
            { id: 1, num: "1", type: "А", name: "Route 1" },
            { id: 2, num: "2", type: "Т", name: "Route 2" },
            { id: 3, num: "3", type: "М", name: "Route 3" }
        ] as Route[];

        it("should return selected routes when provided", () => {
            const selectedRoutes = [
                { id: 1, type: "А" },
                { id: 2, type: "Т" }
            ] as SelectedRoute[];

            const result = getActiveRoutes(selectedRoutes, allRoutes);

            expect(result).toEqual(selectedRoutes);
        });

        it("should return all routes when no routes selected", () => {
            const result = getActiveRoutes([], allRoutes);

            expect(result).toEqual(allRoutes);
        });

        it("should handle empty all routes", () => {
            const selectedRoutes = [{ id: 1, type: "А" }] as SelectedRoute[];
            const result = getActiveRoutes(selectedRoutes, []);

            expect(result).toEqual(selectedRoutes);
        });
    });

    describe("makeRouteIdsString", () => {
        it("should create comma-separated route IDs string", () => {
            const routes = [
                { id: 1, type: "А" },
                { id: 2, type: "Т" },
                { id: 3, type: "М" }
            ] as SelectedRoute[];

            const result = makeRouteIdsString(routes);

            expect(result).toBe("1-0,2-0,3-0");
        });

        it("should return null for empty routes array", () => {
            const result = makeRouteIdsString([]);

            expect(result).toBeNull();
        });

        it("should handle single route", () => {
            const routes = [{ id: 1, type: "А" }] as SelectedRoute[];

            const result = makeRouteIdsString(routes);

            expect(result).toBe("1-0");
        });

        it("should append -0 to each route id", () => {
            const routes = [{ id: 123, type: "А" }] as SelectedRoute[];

            const result = makeRouteIdsString(routes);

            expect(result).toBe("123-0");
        });
    });
});
