import { GeoJson, Map, Marker } from "pigeon-maps"
import '@config'
import config from "@config"
import { useMemo, useState } from "react"
import "./MapContainer.css";
import { useRouteNodesBatch } from "@/hooks/useRouteNodesBatch";
import { useVehiclePositions } from "@/hooks/useVehiclePositions";
import type { Route } from "@/hooks/useRoutes";

interface SelectedRoute {
    id: number;
    type: "А" | "Т" | "М";
}

interface MapContainerProps {
    selectedRoutes: SelectedRoute[];
    routes: Route[];
}

export function MapContainer({ selectedRoutes, routes }: MapContainerProps) {
    const [center, setCenter] = useState<[number, number]>([config.map.lat, config.map.lng]);
    const [zoom, setZoom] = useState<number>(config.map.zoom);

    const routeNodes = useRouteNodesBatch(selectedRoutes);

    const effectiveRoutes = selectedRoutes.length > 0
        ? selectedRoutes
        : routes || [];

    const rids = effectiveRoutes.length > 0
        ? effectiveRoutes.map(r => `${r.id}-0`).join(',')
        : '';

    const { data: vehiclePositions } = useVehiclePositions(rids);

    const features = effectiveRoutes
        .map((route, index) => {
            const result = routeNodes[index];
            if (!result || !result.data || result.data.length < 2) return null;

            const data = result.data;

            const color = config.routes.find(rt => rt.type === route.type)?.color;

            return {
                type: "Feature" as const,
                geometry: {
                    type: "LineString" as const,
                    coordinates: data.map(node => [
                        node.lng / 1_000_000,
                        node.lat / 1_000_000,
                    ]) as [number, number][],
                },
                properties: { stroke: color },
            };
        })
        .filter((feature): feature is NonNullable<typeof feature> => feature !== null);

    const geoJsonData = features.length > 0
        ? { type: "FeatureCollection" as const, features }
        : null;

    const debouncedOnBoundsChanged = useMemo(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        return ({ center, zoom }: { center: [number, number]; zoom: number }) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setCenter(center);
                setZoom(zoom);
            }, 100);
        };
    }, []);

    return (
        <div className="map-container">
            <Map
                center={center}
                zoom={zoom}
                onBoundsChanged={debouncedOnBoundsChanged}
                defaultWidth={window.innerWidth}
            >
                {geoJsonData && (
                    <GeoJson
                        data={geoJsonData}
                        styleCallback={(feature: { properties: { stroke: any; }; }) => ({
                            stroke: feature.properties?.stroke,
                            strokeWidth: 4,
                            fill: "none",
                        })}
                    />
                )}
                {vehiclePositions && vehiclePositions.anims.map(anim =>
                    <Marker
                        key={`${anim.id}-${anim.lasttime}`}
                        anchor={[anim.lat / 1_000_000, anim.lon / 1_000_000]}
                    >
                        <div
                            className="vehicle-marker"
                            style={{
                                backgroundColor: config.routes.find(r => r.type === anim.rtype)?.color || 'gray',
                            }}
                        >
                            {anim.rnum}
                        </div>
                    </Marker>
                )}
            </Map>

            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
                {routeNodes.some(rd => rd.isLoading) && <p>Загрузка маршрутов...</p>}
                {!vehiclePositions && rids && <p>Загрузка позиций транспорта...</p>}
            </div>
        </div>
    )
}