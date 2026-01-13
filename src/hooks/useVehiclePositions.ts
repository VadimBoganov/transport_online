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
        refetchInterval: 10000,
        staleTime: 10 * 1000,
        retry: 1,
        placeholderData: {
            maxk: 0,
            anims: [],
        } as VehiclePosition,
        refetchOnWindowFocus: false, 
    });
}
