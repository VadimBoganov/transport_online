import type { SelectedRoute } from "@/components/MapContainer/MapContainer";
import { buildRouteGeoJSON } from "@/services/routeService";

test('builds valid GeoJSON for routes', () => {
    const routeNodesMap = new Map([
        [1, [{ lat: 60000000, lng: 30000000 }, { lat: 60100000, lng: 30100000 }]]
    ]);

    const routes = [{ id: 1, type: "А" }] as SelectedRoute[];

    const result = buildRouteGeoJSON(routes, routeNodesMap);

    expect(result).toEqual({
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [[30, 60], [30.1, 60.1]]
                },
                properties: { stroke: expect.any(String) }
            }
        ]
    });
});
