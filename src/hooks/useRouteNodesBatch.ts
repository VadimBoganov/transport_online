import { useQueries } from "@tanstack/react-query";

interface RouteNode {
  lat: number;
  lng: number;
}

interface SelectedRoute {
  id: number;
  type: "А" | "Т" | "М";
}

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
      placeholderData: [],
    })),
  });
}