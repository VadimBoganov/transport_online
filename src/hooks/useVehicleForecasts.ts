import { useQuery } from '@tanstack/react-query';

export interface VehicleForecast {
    arrt: number;
    stid: number;
    stname: string;
    stdescr: string;
    lat0: number;
    lng0: number;
    lat1: number;
    lng1: number;
}

interface UseVehicleForecastsProps {
    vid: string | null;
}

export default function useVehicleForecasts({ vid }: UseVehicleForecastsProps) {
    return useQuery<VehicleForecast[], Error>({
        queryKey: ['vehicle-forecasts', vid],
        queryFn: async () => {
            if (!vid) throw new Error('No vehicle ID');

            const res = await fetch(`http://localhost:8000/api/forecasts/vehicle/${vid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                throw new Error(`Ошибка загрузки прогнозов: ${res.status}`);
            }

            const data = await res.json();
            return Array.isArray(data) ? data : [];
        },
        enabled: !!vid,
        retry: 1,
        staleTime: 30 * 1000,
        refetchInterval: 30 * 1000,
        placeholderData: [] as VehicleForecast[],
        refetchOnWindowFocus: false,
    });
}