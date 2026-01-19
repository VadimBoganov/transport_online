import type { RouteNode } from "@/types/transport";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export function useRouteNodes({ routeId }: { routeId: number | null }) {
    return useQuery<RouteNode[], Error>({
        queryKey: ['routeNodes', routeId],
        queryFn: async () => {
            if (!routeId) throw new Error('Route ID is required');
            const data = await api.routeNodes.getByRouteId(routeId);
            return data as RouteNode[];
        },
        enabled: !!routeId,
        staleTime: 1000 * 60 * 5,
        gcTime: 0, // Немедленная очистка при снятии выбора ТС
    });
}