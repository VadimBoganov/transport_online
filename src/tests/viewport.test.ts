import { describe, it, expect } from "vitest";
import {
    calculateViewportBounds,
    isPointInViewport,
    isPointInMapBounds,
    type ViewportBounds
} from "@/services/viewport";

describe("viewport", () => {
    const center: [number, number] = [54.629, 39.742];
    const zoom = 13;
    const width = 800;
    const height = 600;

    describe("calculateViewportBounds", () => {
        it("should calculate bounds centered on given coordinates", () => {
            const bounds = calculateViewportBounds(center, zoom, width, height);

            expect(bounds.north).toBeGreaterThan(center[0]);
            expect(bounds.south).toBeLessThan(center[0]);
            expect(bounds.east).toBeGreaterThan(center[1]);
            expect(bounds.west).toBeLessThan(center[1]);
        });

        it("should create symmetric bounds around center", () => {
            const bounds = calculateViewportBounds(center, zoom, width, height);

            const centerLat = (bounds.north + bounds.south) / 2;
            const centerLng = (bounds.east + bounds.west) / 2;

            expect(centerLat).toBeCloseTo(center[0], 5);
            expect(centerLng).toBeCloseTo(center[1], 5);
        });

        it("should include padding in bounds", () => {
            const padding = 0.05;
            const boundsWithPadding = calculateViewportBounds(center, zoom, width, height, padding);
            const boundsWithoutPadding = calculateViewportBounds(center, zoom, width, height, 0);

            expect(boundsWithPadding.north).toBeGreaterThan(boundsWithoutPadding.north);
            expect(boundsWithPadding.south).toBeLessThan(boundsWithoutPadding.south);
            expect(boundsWithPadding.east).toBeGreaterThan(boundsWithoutPadding.east);
            expect(boundsWithPadding.west).toBeLessThan(boundsWithoutPadding.west);
        });

        it("should create larger bounds for smaller zoom levels", () => {
            const boundsLowZoom = calculateViewportBounds(center, 10, width, height);
            const boundsHighZoom = calculateViewportBounds(center, 15, width, height);

            const rangeLowZoom = boundsLowZoom.north - boundsLowZoom.south;
            const rangeHighZoom = boundsHighZoom.north - boundsHighZoom.south;

            expect(rangeLowZoom).toBeGreaterThan(rangeHighZoom);
        });

        it("should handle different canvas dimensions", () => {
            const squareBounds = calculateViewportBounds(center, zoom, 800, 800);
            const wideBounds = calculateViewportBounds(center, zoom, 1200, 600);

            const squareLatRange = squareBounds.north - squareBounds.south;
            const squareLngRange = squareBounds.east - squareBounds.west;

            const wideLatRange = wideBounds.north - wideBounds.south;
            const wideLngRange = wideBounds.east - wideBounds.west;

            expect(wideLngRange).toBeGreaterThan(squareLngRange);
            expect(wideLatRange).toBeLessThan(squareLatRange);
        });
    });

    describe("isPointInViewport", () => {
        const bounds: ViewportBounds = {
            north: 54.65,
            south: 54.60,
            east: 39.77,
            west: 39.71,
        };

        it("should return true for point inside viewport", () => {
            const lat = 54.630 * 1e6;
            const lng = 39.745 * 1e6;

            expect(isPointInViewport(lat, lng, bounds)).toBe(true);
        });

        it("should return false for point outside viewport (north)", () => {
            const lat = 54.66 * 1e6;
            const lng = 39.745 * 1e6;

            expect(isPointInViewport(lat, lng, bounds)).toBe(false);
        });

        it("should return false for point outside viewport (south)", () => {
            const lat = 54.59 * 1e6;
            const lng = 39.745 * 1e6;

            expect(isPointInViewport(lat, lng, bounds)).toBe(false);
        });

        it("should return false for point outside viewport (east)", () => {
            const lat = 54.630 * 1e6;
            const lng = 39.78 * 1e6;

            expect(isPointInViewport(lat, lng, bounds)).toBe(false);
        });

        it("should return false for point outside viewport (west)", () => {
            const lat = 54.630 * 1e6;
            const lng = 39.70 * 1e6;

            expect(isPointInViewport(lat, lng, bounds)).toBe(false);
        });

        it("should return true for point on boundary", () => {
            const lat = bounds.north * 1e6;
            const lng = bounds.east * 1e6;

            expect(isPointInViewport(lat, lng, bounds)).toBe(true);
        });

        it("should handle coordinates in microdegrees", () => {
            const lat = 54630000;
            const lng = 39745000;

            expect(isPointInViewport(lat, lng, bounds)).toBe(true);
        });
    });

    describe("isPointInMapBounds", () => {
        const mapBounds = {
            ne: [54.65, 39.77] as [number, number],
            sw: [54.60, 39.71] as [number, number],
        };

        it("should return true for point inside bounds", () => {
            const lat = 54.630 * 1e6;
            const lng = 39.745 * 1e6;

            expect(isPointInMapBounds(lat, lng, mapBounds)).toBe(true);
        });

        it("should return false for point outside bounds", () => {
            const lat = 54.66 * 1e6;
            const lng = 39.745 * 1e6;

            expect(isPointInMapBounds(lat, lng, mapBounds)).toBe(false);
        });

        it("should handle boundaries correctly", () => {
            const [neLat, neLng] = mapBounds.ne;
            const [swLat, swLng] = mapBounds.sw;

            expect(isPointInMapBounds(neLat * 1e6, neLng * 1e6, mapBounds)).toBe(true);
            expect(isPointInMapBounds(swLat * 1e6, swLng * 1e6, mapBounds)).toBe(true);
        });

        it("should handle coordinates in microdegrees", () => {
            const lat = 54630000;
            const lng = 39745000;

            expect(isPointInMapBounds(lat, lng, mapBounds)).toBe(true);
        });

        it("should return false for coordinates outside northeast corner", () => {
            const lat = (mapBounds.ne[0] + 0.01) * 1e6;
            const lng = (mapBounds.ne[1] + 0.01) * 1e6;

            expect(isPointInMapBounds(lat, lng, mapBounds)).toBe(false);
        });

        it("should return false for coordinates outside southwest corner", () => {
            const lat = (mapBounds.sw[0] - 0.01) * 1e6;
            const lng = (mapBounds.sw[1] - 0.01) * 1e6;

            expect(isPointInMapBounds(lat, lng, mapBounds)).toBe(false);
        });
    });
});
