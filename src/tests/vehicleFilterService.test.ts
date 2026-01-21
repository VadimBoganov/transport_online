import { describe, it, expect } from "vitest";
import { filterVehiclesBySelectedRoutes, buildSelectedVehicleGeoJSON } from "@/services/vehicleService";
import type { Animation, SelectedRoute, RouteNode } from "@/types/transport";

describe("vehicleService", () => {
    const vehicles = [
        { id: "1", rid: 1, rtype: "А", rnum: "1А" },
        { id: "2", rid: 2, rtype: "Т", rnum: "2Т" },
        { id: "3", rid: 3, rtype: "М", rnum: "3М" },
    ] as Animation[];

    const selectedRoutes = [{ id: 1, type: "А" }, { id: 2, type: "Т" }] as SelectedRoute[];

    describe("filterVehiclesBySelectedRoutes", () => {
        it("should filter vehicles by selected routes", () => {
            const result = filterVehiclesBySelectedRoutes(vehicles, selectedRoutes);
            expect(result).toEqual([
                vehicles[0],
                vehicles[1],
            ]);
        });

        it("should return all vehicles if no routes selected", () => {
            const result = filterVehiclesBySelectedRoutes(vehicles, []);
            expect(result).toEqual(vehicles);
        });

        it("should return empty array when vehicles is undefined", () => {
            const result = filterVehiclesBySelectedRoutes(undefined, selectedRoutes);
            expect(result).toEqual([]);
        });

        it("should return empty array when both undefined and empty", () => {
            const result = filterVehiclesBySelectedRoutes(undefined, []);
            expect(result).toEqual([]);
        });

        it("should handle when no vehicles match selected routes", () => {
            const noMatchRoutes: SelectedRoute[] = [{ id: 999, type: "А" }];
            const result = filterVehiclesBySelectedRoutes(vehicles, noMatchRoutes);
            expect(result).toEqual([]);
        });

        it("should handle single route selection", () => {
            const singleRoute = [{ id: 1, type: "А" }] as SelectedRoute[];
            const result = filterVehiclesBySelectedRoutes(vehicles, singleRoute);
            expect(result).toEqual([vehicles[0]]);
        });
    });

    describe("buildSelectedVehicleGeoJSON", () => {
        const mockRouteNodes: RouteNode[] = [
            { lat: 60000000, lng: 30000000 },
            { lat: 60100000, lng: 30100000 },
            { lat: 60200000, lng: 30200000 },
        ];

        it("should build GeoJSON for selected vehicle", () => {
            const selectedVehicle = { rid: 1, rtype: "А" };
            const result = buildSelectedVehicleGeoJSON(selectedVehicle, mockRouteNodes);

            expect(result).not.toBeNull();
            expect(result?.type).toBe("FeatureCollection");
            expect(result?.features).toHaveLength(1);
            expect(result?.features[0].geometry.type).toBe("LineString");
            expect(result?.features[0].geometry.coordinates).toHaveLength(3);
        });

        it("should return null when selectedVehicle is null", () => {
            const result = buildSelectedVehicleGeoJSON(null, mockRouteNodes);
            expect(result).toBeNull();
        });

        it("should return null when routeNodes is undefined", () => {
            const selectedVehicle = { rid: 1, rtype: "А" };
            const result = buildSelectedVehicleGeoJSON(selectedVehicle, undefined);
            expect(result).toBeNull();
        });

        it("should return null when routeNodes is empty", () => {
            const selectedVehicle = { rid: 1, rtype: "А" };
            const result = buildSelectedVehicleGeoJSON(selectedVehicle, []);
            expect(result).toBeNull();
        });

        it("should use correct color from config", () => {
            const selectedVehicle = { rid: 1, rtype: "А" };
            const result = buildSelectedVehicleGeoJSON(selectedVehicle, mockRouteNodes);

            expect(result?.features[0].properties?.stroke).toBeDefined();
        });

        it("should handle route type not in config", () => {
            const selectedVehicle = { rid: 1, rtype: "UnknownType" };
            const result = buildSelectedVehicleGeoJSON(selectedVehicle, mockRouteNodes);

            expect(result?.features[0].properties?.stroke).toBe("gray");
        });
    });
});
