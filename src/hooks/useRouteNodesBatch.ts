import type { RouteNode, SelectedRoute } from "@/types/transport";
import { useQueries } from "@tanstack/react-query";
import { api } from "@/api/client";

export function useRouteNodesBatch(routes: SelectedRoute[]) {
  return useQueries({
    queries: routes.map(({ id }) => ({
      queryKey: ['routeNodes', id],
      queryFn: async () => {
        const data = await api.routeNodes.getByRouteId(id);
        return data as RouteNode[];
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 1,
      placeholderData: [],
    })),
  });
}