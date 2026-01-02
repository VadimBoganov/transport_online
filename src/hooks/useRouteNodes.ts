import { useQuery } from "@tanstack/react-query";

export interface RouteNode {
    lat: number;
    lng: number;
}

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
        placeholderData: [] as RouteNode[],
    });
}