import type { StationForecast } from "@/types/transport";

export const sortForecastsByArrivalTime = (forecasts: StationForecast[] | undefined): StationForecast[] => {
    if (!forecasts) return [];

    return forecasts.filter(isForecastValid).sort((a, b) => a.arrt - b.arrt);
};

export const formatArrivalMinutes = (arrt: number): number => {
    return Math.round(arrt / 60);
};

export const isForecastValid = (forecast: StationForecast): boolean => {
    const now = Math.floor(Date.now() / 1000);
    return forecast.arrt > now - 60 * 5;
};

export const processForecasts = (forecasts: StationForecast[] | undefined): StationForecast[] => {
    return sortForecastsByArrivalTime(forecasts);
};
