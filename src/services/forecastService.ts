import type { VehicleForecast } from "@/types/transport";

type ForecastWithArrival = { arrt: number };

export const sortForecastsByArrivalTime = <T extends ForecastWithArrival>(
    forecasts: T[] | undefined
): T[] => {
    if (!forecasts) return [];

    return forecasts.sort((a, b) => a.arrt - b.arrt);
};

export const formatArrivalMinutes = (arrt: number): number => {
    return Math.round(arrt / 60);
};

export const isForecastValid = (forecast: ForecastWithArrival): boolean => {
    const now = Math.floor(Date.now() / 1000);
    return forecast.arrt > now - 60 * 5;
};

export const processForecasts = <T extends ForecastWithArrival>(
    forecasts: T[] | undefined
): T[] => {
    return sortForecastsByArrivalTime(forecasts);
};

export const makeVehicleForecasts = (forecasts: VehicleForecast[]): {
    current: VehicleForecast;
    next: VehicleForecast;
}[] => {
    if (!forecasts || forecasts.length === 0) return [];

    const grouped = forecasts.reduce((acc, forecast) => {
        const key = `${forecast.rnum}-${forecast.rtype}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(forecast);
        return acc;
    }, {} as Record<string, VehicleForecast[]>);

    return Object.values(grouped)
        .map((group) => {
            const sorted = group.sort((a, b) => a.arrt - b.arrt);
            return { current: sorted[0] || null, next: sorted[1] || null };
        })
        .filter(item => item.current);
}