import type { VehicleForecast } from "@/types/transport";

export const sortForecastsByArrivalTime = (forecasts: VehicleForecast[] | undefined): VehicleForecast[] => {
    if (!forecasts) return [];

    return [...forecasts].sort((a, b) => a.arrt - b.arrt);
};

export const formatArrivalMinutes = (arrt: number): number => {
    return Math.round(arrt / 60);
};

export const isForecastValid = (forecast: VehicleForecast): boolean => {
    const now = Math.floor(Date.now() / 1000);
    return forecast.arrt > now - 60 * 5;
};

export const processForecasts = (forecasts: VehicleForecast[] | undefined): VehicleForecast[] => {
    return sortForecastsByArrivalTime(forecasts);
};
