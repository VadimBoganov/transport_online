import { sortForecastsByArrivalTime, formatArrivalMinutes, processForecasts } from "@/services/forecastService";
import type { StationForecast } from "@/types/transport";

const mockForecasts = [
    { arrt: 1800, stid: 1, stname: "A" },
    { arrt: 900, stid: 2, stname: "B" },
    { arrt: 2700, stid: 3, stname: "C" },
] as StationForecast[];

test("sorts forecasts by arrival time", () => {
    const result = sortForecastsByArrivalTime(mockForecasts);
    expect(result).toEqual([
        mockForecasts[1], 
        mockForecasts[0], 
        mockForecasts[2],
    ]);
});

test("formats arrival time in minutes", () => {
    expect(formatArrivalMinutes(920)).toBe(15);
    expect(formatArrivalMinutes(180)).toBe(3);
});

test("processForecasts returns sorted list", () => {
    const result = processForecasts(mockForecasts);
    expect(result[0].arrt).toBe(900);
});
