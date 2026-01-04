import { useQuery } from '@tanstack/react-query';

interface VehiclePosition {
    maxk: number;
    anims: Animation[];
}

interface Animation {
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

export function useVehiclePositions(rids: string) {
    return useQuery<VehiclePosition, Error>({
        queryKey: ['vehiclePositions', rids],
        queryFn: async (): Promise<VehiclePosition> => {
            const baseUrl = 'http://localhost:8000/api/vehicles/';
            const encodedRids = encodeURIComponent(rids);
            const url = baseUrl + encodedRids;

            const res = await fetch(url.toString(), {
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
    });
}
