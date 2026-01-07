import { useQuery } from '@tanstack/react-query';

export interface Forecast {
    arrt: number;          
    where: string;         
    vehid: string;         
    rid: number;           
    rtype: 'А' | 'Т' | 'М'; 
    rnum: string;          
    lastst: string;        
}

interface UseStationForecastProps {
    stationId: number | null; 
}

export default function useStationForecast({ stationId }: UseStationForecastProps) {
     return useQuery<Forecast[], Error>({
        queryKey: ['station-forecast', stationId],
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
        staleTime: 30 * 1000,           
        refetchInterval: 30 * 1000,     
        retry: 1,
        placeholderData: [] as Forecast[],
        refetchOnWindowFocus: false,    
    });
}
