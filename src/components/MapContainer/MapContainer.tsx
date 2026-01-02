import { GeoJson, Map } from "pigeon-maps"
import '@config'
import config from "@config"
import { useState } from "react"
import "./MapContainer.css";
import { useRouteNodes } from "@/hooks/useRouteNodes";

interface MapContainerProps {
  selectedRouteId: number | null;
  selectedRouteType: "А" | "Т" | "М" | null; // TransportType
}

export function MapContainer({ selectedRouteId, selectedRouteType }: MapContainerProps) {
    const [center, setCenter] = useState<[number, number]>([config.map.lat, config.map.lng]);
    const [zoom, setZoom] = useState<number>(config.map.zoom);

    const { data: nodes, isLoading: loading } = useRouteNodes({ routeId: selectedRouteId });
    const safeNodes = nodes || [];

    const geoJsonData = safeNodes.length > 1 ? {
        features: [
            {
                type: "Feature",
                geometry: { type: "LineString", coordinates: safeNodes.map(node => [node.lng / 1000000, node.lat / 1000000] as [number, number]) },
            },
        ]
    } : null;

    const routeConfig = config.routes.find((r) => r.type === selectedRouteType);

    return (
        <div className="map-container">
            <Map
                center={center}
                zoom={zoom}
                onBoundsChanged={({ center, zoom }) => {
                    setCenter(center);
                    setZoom(zoom);
                }}
            >
                {geoJsonData && (
                    <GeoJson
                        data={geoJsonData}
                        styleCallback={() => ({
                            stroke: routeConfig?.color,
                            strokeWidth: 4,
                            fill: "none",
                        })}
                    />
                )}
            </Map>

            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
                {loading && <p>Загрузка маршрута...</p>}
            </div>
        </div>
    )
}