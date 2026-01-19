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
        refetchInterval: !!rids ? 10000 : false, // Останавливаем интервал когда rids === null
        staleTime: 10 * 1000,
        gcTime: 0, // Немедленная очистка при размонтировании
        retry: 1,
        refetchOnWindowFocus: false, 
    });
}
