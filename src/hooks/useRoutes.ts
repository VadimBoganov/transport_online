import type { Route } from "@/types/transport";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export function useRoutes() {
    return useQuery<Route[], Error>({
        queryKey: ['routes'],
        queryFn: async () => {
            const data = await api.routes.getAll();
            return Array.isArray(data) ? data : (data as { routes: Route[] }).routes;
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 15, // Можно оставить долго - данные статические
        refetchOnWindowFocus: false,
        retry: 1,
    });
}