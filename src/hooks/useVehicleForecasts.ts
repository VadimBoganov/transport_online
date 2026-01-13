import type { StationForecast } from '@/types/transport';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

interface UseVehicleForecastsProps {
    vid: string | null;
}

export default function useVehicleForecasts({ vid }: UseVehicleForecastsProps) {
    return useQuery<StationForecast[], Error>({
        queryKey: ['vehicle-forecasts', vid],
        queryFn: async () => {
            if (!vid) throw new Error('No vehicle ID');

            const data = await api.forecasts.getByVehicleId(vid);
            return Array.isArray(data) ? data : [];
        },
        enabled: !!vid,
        retry: 1,
        staleTime: 30 * 1000,
        refetchInterval: 30 * 1000,
        placeholderData: [] as StationForecast[],
        refetchOnWindowFocus: false,
    });
}