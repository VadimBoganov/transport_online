import type { Station } from '@/types/transport';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

export function useStations() {
    return useQuery<Station[], Error>({
        queryKey: ['stations'],
        queryFn: async () => {
            const data = await api.stations.getAll();
            return Array.isArray(data) ? data : (data as { stations: Station[] }).stations;
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 15,
        placeholderData: [] as Station[],
        refetchOnWindowFocus: false,
        retry: 1,
    });
}
