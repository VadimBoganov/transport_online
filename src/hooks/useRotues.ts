import { useQuery } from "@tanstack/react-query";

export interface Route {
    id: number;
    name: string;
    num: string;
    type: string;
    fromst: string;
    tost: string;
}

export function useRoutes() {
    return useQuery<Route[], Error>({
        queryKey: ['routes'],
        queryFn: async () => {
            const res = await fetch('http://localhost:8000/api/routes', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                throw new Error(`Ошибка загрузки маршрутов: ${res.status}`);
            }

            const data = await res.json();

            return Array.isArray(data) ? data : data.routes;
        },
    });
}