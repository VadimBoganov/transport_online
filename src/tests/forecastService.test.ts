import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    sortForecastsByArrivalTime,
    formatArrivalMinutes,
    isForecastValid,
    processForecasts,
    makeVehicleForecasts
} from "@/services/forecastService";
import type { StationForecast, VehicleForecast } from "@/types/transport";

describe("forecastService", () => {
    const mockForecasts = [
        { arrt: 1800, stid: 1, stname: "A" },
        { arrt: 900, stid: 2, stname: "B" },
        { arrt: 2700, stid: 3, stname: "C" },
    ] as StationForecast[];

    describe("sortForecastsByArrivalTime", () => {
        it("should sort forecasts by arrival time in ascending order", () => {
            const result = sortForecastsByArrivalTime(mockForecasts);
            expect(result[0].arrt).toBe(900);
            expect(result[1].arrt).toBe(1800);
            expect(result[2].arrt).toBe(2700);
        });

        it("should return empty array when forecasts is undefined", () => {
            const result = sortForecastsByArrivalTime(undefined);
            expect(result).toEqual([]);
        });

        it("should handle empty array", () => {
            const result = sortForecastsByArrivalTime([]);
            expect(result).toEqual([]);
        });

        it("should handle single forecast", () => {
            const single = [mockForecasts[0]];
            const result = sortForecastsByArrivalTime(single);
            expect(result).toEqual(single);
        });
    });

    describe("formatArrivalMinutes", () => {
        it("should format seconds to minutes", () => {
            expect(formatArrivalMinutes(920)).toBe(15);
            expect(formatArrivalMinutes(180)).toBe(3);
        });

        it("should round to nearest minute", () => {
            expect(formatArrivalMinutes(90)).toBe(2);
            expect(formatArrivalMinutes(89)).toBe(1);
        });

        it("should handle zero", () => {
            expect(formatArrivalMinutes(0)).toBe(0);
        });

        it("should handle negative values", () => {
            expect(formatArrivalMinutes(-60)).toBe(-1);
        });
    });

    describe("isForecastValid", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should return true for forecast in the future", () => {
            const now = Date.now();
            vi.setSystemTime(now);

            const forecast: StationForecast = {
                arrt: Math.floor(now / 1000) + 600,
                stid: 1,
                stname: "Test",
            } as StationForecast;

            expect(isForecastValid(forecast)).toBe(true);
        });

        it("should return false for forecast older than 5 minutes", () => {
            const now = Date.now();
            vi.setSystemTime(now);

            const forecast: StationForecast = {
                arrt: Math.floor(now / 1000) - 400,
                stid: 1,
                stname: "Test",
            } as StationForecast;

            expect(isForecastValid(forecast)).toBe(false);
        });

        it("should return true for forecast within 5 minutes threshold", () => {
            const now = Date.now();
            vi.setSystemTime(now);

            const forecast: StationForecast = {
                arrt: Math.floor(now / 1000) - 200,
                stid: 1,
                stname: "Test",
            } as StationForecast;

            expect(isForecastValid(forecast)).toBe(true);
        });
    });

    describe("processForecasts", () => {
        it("should return sorted list", () => {
            const result = processForecasts(mockForecasts);
            expect(result[0].arrt).toBe(900);
            expect(result[result.length - 1].arrt).toBe(2700);
        });

        it("should handle undefined", () => {
            const result = processForecasts(undefined);
            expect(result).toEqual([]);
        });

        it("should handle empty array", () => {
            const result = processForecasts([]);
            expect(result).toEqual([]);
        });
    });

    describe("makeVehicleForecasts", () => {
        const mockVehicleForecasts: VehicleForecast[] = [
            { rnum: "1", rtype: "А", arrt: 300, where: "End", vehid: "v1", rid: 1, lastst: "Last1" },
            { rnum: "1", rtype: "А", arrt: 600, where: "End", vehid: "v2", rid: 1, lastst: "Last2" },
            { rnum: "2", rtype: "Т", arrt: 400, where: "End", vehid: "v3", rid: 2, lastst: "Last3" },
            { rnum: "2", rtype: "Т", arrt: 800, where: "End", vehid: "v4", rid: 2, lastst: "Last4" },
        ];

        it("should group forecasts by route number and type", () => {
            const result = makeVehicleForecasts(mockVehicleForecasts);

            expect(result).toHaveLength(2);
            expect(result[0].current.rnum).toBe("1");
            expect(result[0].current.arrt).toBe(300);
            expect(result[0].next.arrt).toBe(600);
        });

        it("should sort forecasts within each group by arrival time", () => {
            const unorderedForecasts: VehicleForecast[] = [
                { rnum: "1", rtype: "А", arrt: 600, where: "End", vehid: "v2", rid: 1, lastst: "Last2" },
                { rnum: "1", rtype: "А", arrt: 300, where: "End", vehid: "v1", rid: 1, lastst: "Last1" },
            ];

            const result = makeVehicleForecasts(unorderedForecasts);

            expect(result[0].current.arrt).toBe(300);
            expect(result[0].next.arrt).toBe(600);
        });

        it("should handle empty array", () => {
            const result = makeVehicleForecasts([]);
            expect(result).toEqual([]);
        });

        it("should handle single forecast per route", () => {
            const singleForecasts: VehicleForecast[] = [
                { rnum: "1", rtype: "А", arrt: 300, where: "End", vehid: "v1", rid: 1, lastst: "Last1" },
            ];

            const result = makeVehicleForecasts(singleForecasts);

            expect(result).toHaveLength(1);
            expect(result[0].current.arrt).toBe(300);
            expect(result[0].next).toBeNull();
        });

        it("should filter out groups without current forecast", () => {
            const result = makeVehicleForecasts(mockVehicleForecasts);

            result.forEach(group => {
                expect(group.current).toBeTruthy();
            });
        });

        it("should handle multiple routes with same number but different types", () => {
            const mixedForecasts: VehicleForecast[] = [
                { rnum: "1", rtype: "А", arrt: 300, where: "End", vehid: "v1", rid: 1, lastst: "Last1" },
                { rnum: "1", rtype: "Т", arrt: 400, where: "End", vehid: "v2", rid: 2, lastst: "Last2" },
            ];

            const result = makeVehicleForecasts(mixedForecasts);

            expect(result).toHaveLength(2);
        });
    });
});
