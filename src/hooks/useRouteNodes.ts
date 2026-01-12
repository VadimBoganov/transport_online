import type { RouteNode } from "@/types/transport";
import { useQuery } from "@tanstack/react-query";



export function useRouteNodes({ routeId }: { routeId: number | null }) {
    return useQuery<RouteNode[], Error>({
        queryKey: ['routeNodes', routeId],
        queryFn: async () => {
            const res = await fetch(`http://localhost:8000/api/routenodes/${routeId}`);
            if (!res.ok) throw new Error('Не удалось загрузить узлы маршрута');
            return res.json();
        },
        enabled: !!routeId,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 15,
        placeholderData: [] as RouteNode[],
    });
}