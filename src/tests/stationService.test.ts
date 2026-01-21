import { describe, it, expect } from "vitest";
import { shouldOpenStationPopup } from "@/services/stationService";
import type { SelectedStation } from "@/types/transport";

describe("stationService", () => {
    describe("shouldOpenStationPopup", () => {
        const station1: SelectedStation = {
            id: 1,
            name: "Station A",
            lat: 54.629,
            lng: 39.742,
        };

        const station2: SelectedStation = {
            id: 2,
            name: "Station B",
            lat: 54.635,
            lng: 39.750,
        };

        it("should return true when opening a new station with no active station", () => {
            expect(shouldOpenStationPopup(station1, null)).toBe(true);
        });

        it("should return false when newStation is null", () => {
            expect(shouldOpenStationPopup(null, station1)).toBe(false);
        });

        it("should return false when trying to open the same station", () => {
            expect(shouldOpenStationPopup(station1, station1)).toBe(false);
        });

        it("should return true when switching to a different station", () => {
            expect(shouldOpenStationPopup(station2, station1)).toBe(true);
        });

        it("should return true when opening station after closing previous one", () => {
            expect(shouldOpenStationPopup(station1, null)).toBe(true);
        });

        it("should handle stations with same id but different properties", () => {
            const stationCopy = { ...station1, name: "Different Name" };
            expect(shouldOpenStationPopup(stationCopy, station1)).toBe(false);
        });

        it("should return false when both are null", () => {
            expect(shouldOpenStationPopup(null, null)).toBe(false);
        });
    });
});
