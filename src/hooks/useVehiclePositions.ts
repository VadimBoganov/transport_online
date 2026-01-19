import type { VehiclePosition } from '@/types/transport';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

export function useVehiclePositions(rids: string | null) {
    return useQuery<VehiclePosition, Error>({
        queryKey: ['vehiclePositions', rids],
        queryFn: async (): Promise<VehiclePosition> => {
            if (!rids) {
                throw new Error('No route IDs provided');
            }

            const data = await api.vehicles.getByRouteIds(rids);
            return data as VehiclePosition;
        },
        enabled: !!rids,
        refetchInterval: (query) => {
            return query.state.data && rids ? 10000 : false;
        },
        staleTime: 10 * 1000,
        gcTime: 1000 * 1,
        retry: 1,
        refetchOnWindowFocus: false, 
    });
}
