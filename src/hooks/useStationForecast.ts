import type { VehicleForecast } from '@/types/transport';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

interface UseStationForecastProps {
    stationId: number | null;
}

// Экспортируем queryKey для ручного управления
export const stationForecastQueryKey = (stationId: number | null) => ['station-forecast', stationId];

export default function useStationForecast({ stationId }: UseStationForecastProps) {
    return useQuery<VehicleForecast[], Error>({
        queryKey: stationForecastQueryKey(stationId),
        queryFn: async () => {
            if (!stationId) throw new Error('No station ID');

            const data = await api.forecasts.getByStationId(stationId);
            return Array.isArray(data) ? data : [];
        },
        enabled: !!stationId,
        staleTime: 1000 * 30,           
        gcTime: 1000 * 1,             
        refetchInterval: 1000 * 30,     
        retry: 1,
        placeholderData: undefined,    
        refetchOnWindowFocus: false,
    });
}