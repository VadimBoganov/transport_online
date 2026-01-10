import { useQuery } from '@tanstack/react-query';

export interface VehiclePosition {
    maxk: number;
    anims: Animation[];
}

export interface Animation {
    id: string;
    lat: number;
    lon: number;
    rid: number;
    dir: number;
    speed: number;
    lasttime: string;
    gos_num: string;
    rnum: string;
    rtype: string;
    low_floor: boolean;
}

export function useVehiclePositions(rids: string | null) {
    return useQuery<VehiclePosition, Error>({
        queryKey: ['vehiclePositions', rids],
        queryFn: async (): Promise<VehiclePosition> => {
            if (!rids) {
                throw new Error('No route IDs provided');
            }

            const baseUrl = 'http://localhost:8000/api/vehicles/';
            const encodedRids = encodeURIComponent(rids);
            const url = baseUrl + encodedRids;

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
            }

            const data = await res.json();
            return data;
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
