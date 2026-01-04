import { useQuery } from '@tanstack/react-query';

export interface Station {
    id: number;
    name: string;
    descr: string;
    lat: number;
    lng: number;
    type: number;
}

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
    });
}
