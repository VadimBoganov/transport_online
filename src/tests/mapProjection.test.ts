import { describe, it, expect } from "vitest";
import { latLonToCanvasPixel, canvasPixelToLatLon } from "@/services/mapProjection";

describe("mapProjection", () => {
    const canvasWidth = 800;
    const canvasHeight = 600;
    const mapCenter: [number, number] = [54.629, 39.742];
    const zoom = 13;

    describe("latLonToCanvasPixel", () => {
        it("should convert map center to canvas center", () => {
            const [x, y] = latLonToCanvasPixel(
                mapCenter[0],
                mapCenter[1],
                zoom,
                canvasWidth,
                canvasHeight,
                mapCenter
            );

            expect(x).toBeCloseTo(canvasWidth / 2, 1);
            expect(y).toBeCloseTo(canvasHeight / 2, 1);
        });

        it("should convert coordinates north of center to y < centerY", () => {
            const northLat = mapCenter[0] + 0.01;
            const [, y] = latLonToCanvasPixel(
                northLat,
                mapCenter[1],
                zoom,
                canvasWidth,
                canvasHeight,
                mapCenter
            );

            expect(y).toBeLessThan(canvasHeight / 2);
        });

        it("should convert coordinates east of center to x > centerX", () => {
            const eastLon = mapCenter[1] + 0.01;
            const [x] = latLonToCanvasPixel(
                mapCenter[0],
                eastLon,
                zoom,
                canvasWidth,
                canvasHeight,
                mapCenter
            );

            expect(x).toBeGreaterThan(canvasWidth / 2);
        });

        it("should handle different zoom levels", () => {
            const point: [number, number] = [mapCenter[0] + 0.01, mapCenter[1] + 0.01];
            
            const [x1, y1] = latLonToCanvasPixel(
                point[0],
                point[1],
                zoom,
                canvasWidth,
                canvasHeight,
                mapCenter
            );

            const [x2, y2] = latLonToCanvasPixel(
                point[0],
                point[1],
                zoom + 1,
                canvasWidth,
                canvasHeight,
                mapCenter
            );

            const distance1 = Math.sqrt(
                Math.pow(x1 - canvasWidth / 2, 2) + Math.pow(y1 - canvasHeight / 2, 2)
            );
            const distance2 = Math.sqrt(
                Math.pow(x2 - canvasWidth / 2, 2) + Math.pow(y2 - canvasHeight / 2, 2)
            );

            expect(distance2).toBeGreaterThan(distance1);
        });
    });

    describe("canvasPixelToLatLon", () => {
        it("should convert canvas center back to map center", () => {
            const [lat, lon] = canvasPixelToLatLon(
                canvasWidth / 2,
                canvasHeight / 2,
                zoom,
                canvasWidth,
                canvasHeight,
                mapCenter
            );

            expect(lat).toBeCloseTo(mapCenter[0], 5);
            expect(lon).toBeCloseTo(mapCenter[1], 5);
        });

        it("should be inverse of latLonToCanvasPixel", () => {
            const originalLat = 54.635;
            const originalLon = 39.750;

            const [x, y] = latLonToCanvasPixel(
                originalLat,
                originalLon,
                zoom,
                canvasWidth,
                canvasHeight,
                mapCenter
            );

            const [lat, lon] = canvasPixelToLatLon(
                x,
                y,
                zoom,
                canvasWidth,
                canvasHeight,
                mapCenter
            );

            expect(lat).toBeCloseTo(originalLat, 5);
            expect(lon).toBeCloseTo(originalLon, 5);
        });

        it("should handle corner coordinates", () => {
            const [topLeftLat, topLeftLon] = canvasPixelToLatLon(
                0,
                0,
                zoom,
                canvasWidth,
                canvasHeight,
                mapCenter
            );

            expect(topLeftLat).toBeGreaterThan(mapCenter[0]);
            expect(topLeftLon).toBeLessThan(mapCenter[1]);

            const [bottomRightLat, bottomRightLon] = canvasPixelToLatLon(
                canvasWidth,
                canvasHeight,
                zoom,
                canvasWidth,
                canvasHeight,
                mapCenter
            );

            expect(bottomRightLat).toBeLessThan(mapCenter[0]);
            expect(bottomRightLon).toBeGreaterThan(mapCenter[1]);
        });
    });

    describe("round-trip conversion", () => {
        it("should maintain precision through multiple conversions", () => {
            const testPoints: [number, number][] = [
                [54.620, 39.730],
                [54.635, 39.755],
                [54.640, 39.740],
            ];

            testPoints.forEach(([lat, lon]) => {
                const [x, y] = latLonToCanvasPixel(
                    lat,
                    lon,
                    zoom,
                    canvasWidth,
                    canvasHeight,
                    mapCenter
                );

                const [convertedLat, convertedLon] = canvasPixelToLatLon(
                    x,
                    y,
                    zoom,
                    canvasWidth,
                    canvasHeight,
                    mapCenter
                );

                expect(convertedLat).toBeCloseTo(lat, 5);
                expect(convertedLon).toBeCloseTo(lon, 5);
            });
        });
    });
});
