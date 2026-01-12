import type { Station } from '@/types/transport';
import { useQuery } from '@tanstack/react-query';

export function useStations() {
    return useQuery<Station[], Error>({
        queryKey: ['stations'],
        queryFn: async () => {
            const res = await fetch('http://localhost:8000/api/stations', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                throw new Error(`Ошибка загрузки остановок: ${res.status}`);
            }

            const data = await res.json();
            return Array.isArray(data) ? data : data.stations;
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 15,
        placeholderData: [] as Station[],
        refetchOnWindowFocus: false,
        retry: 1,
    });
}
