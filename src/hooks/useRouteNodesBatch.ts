import type { RouteNode, SelectedRoute } from "@/types/transport";
import { useQueries } from "@tanstack/react-query";

export function useRouteNodesBatch(routes: SelectedRoute[]) {
  return useQueries({
    queries: routes.map(({ id }) => ({
      queryKey: ['routeNodes', id],
      queryFn: async () => {
        const res = await fetch(`http://localhost:8000/api/routenodes/${id}`);
        if (!res.ok) throw new Error(`Ошибка загрузки маршрута ${id}`);
        return (await res.json()) as RouteNode[];
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 15,
      placeholderData: [],
    })),
  });
}