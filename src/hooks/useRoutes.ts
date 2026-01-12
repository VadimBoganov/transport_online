import type { Route } from "@/types/transport";
import { useQuery } from "@tanstack/react-query";

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
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 15,
        placeholderData: [] as Route[],
        refetchOnWindowFocus: false,
        retry: 1,
    });
}