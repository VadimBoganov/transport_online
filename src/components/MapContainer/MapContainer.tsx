import { GeoJson, Map } from "pigeon-maps"
import '@config'
import config from "@config"
import { useMemo, useState } from "react"
import "./MapContainer.css";
import { useRouteNodesBatch } from "@/hooks/useRouteNodesBatch";

interface SelectedRoute {
    id: number;
    type: "А" | "Т" | "М";
}

interface MapContainerProps {
    selectedRoutes: SelectedRoute[];
}

export function MapContainer({ selectedRoutes }: MapContainerProps) {
    const [center, setCenter] = useState<[number, number]>([config.map.lat, config.map.lng]);
    const [zoom, setZoom] = useState<number>(config.map.zoom);

    const routeNodes = useRouteNodesBatch(selectedRoutes);

    const features = selectedRoutes
        .map((route, index) => {
            const result = routeNodes[index];
            const data = result.data;

            if (!data || data.length < 2) return null;

            const color = config.routes.find(rt => rt.type === route.type)?.color || "#1a73e8";

            return {
                type: "Feature" as const,
                geometry: {
                    type: "LineString" as const,
                    coordinates: data.map(node => [
                        node.lng / 1000000,
                        node.lat / 1000000,
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
            </Map>

            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
                {routeNodes.some(rd => rd.isLoading) && <p>Загрузка маршрутов...</p>}
            </div>
        </div>
    )
}