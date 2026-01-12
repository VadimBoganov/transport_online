import type { Forecast } from '@/types/transport';
import { useQuery } from '@tanstack/react-query';

interface UseStationForecastProps {
    stationId: number | null;
}

// Экспортируем queryKey для ручного управления
export const stationForecastQueryKey = (stationId: number | null) => ['station-forecast', stationId];

export default function useStationForecast({ stationId }: UseStationForecastProps) {

    return useQuery<Forecast[], Error>({
        queryKey: stationForecastQueryKey(stationId),
        queryFn: async () => {
            if (!stationId) throw new Error('No station ID');

            const res = await fetch(`http://localhost:8000/api/forecasts/station/${stationId}`, {
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
        enabled: !!stationId,
        staleTime: 1000 * 30,           
        gcTime: 1000 * 1,             
        refetchInterval: 1000 * 30,     
        retry: 1,
        placeholderData: undefined,    
        refetchOnWindowFocus: false,
    });
}