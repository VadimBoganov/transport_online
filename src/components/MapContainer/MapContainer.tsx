import { GeoJson, Map, Overlay } from "pigeon-maps"
import '@config'
import config from "@config"
import { useMemo, useState } from "react"
import "./MapContainer.css";
import { useRouteNodesBatch } from "@/hooks/useRouteNodesBatch";
import { useVehiclePositions } from "@/hooks/useVehiclePositions";
import type { Route } from "@/hooks/useRoutes";
import { StationPopup } from "@components/MapContainer/StationPopup";
import { useRouteNodes } from "@/hooks/useRouteNodes";

interface SelectedRoute {
    id: number;
    type: "А" | "Т" | "М";
}

interface MapContainerProps {
    selectedRoutes: SelectedRoute[];
    routes: Route[];
    center: [number, number];
    zoom: number;
    onCenterChange?: (center: [number, number], zoom: number) => void;
    selectedStation: { lat: number; lng: number, id: number, name: string } | null;
    onStationDeselect: () => void;
}

export function MapContainer({
    selectedRoutes,
    routes,
    center,
    zoom,
    onCenterChange,
    selectedStation,
    onStationDeselect
}: MapContainerProps) {
    const routeNodes = useRouteNodesBatch(selectedRoutes);

    const effectiveRoutes = selectedRoutes.length > 0 ? selectedRoutes : routes || [];
    const rids = effectiveRoutes.length > 0 ? effectiveRoutes.map(r => `${r.id}-0`).join(',') : '';
    const { data: vehiclePositions } = useVehiclePositions(rids);

    const [selectedVehicle, setSelectedVehicle] = useState<{ rid: number; rtype: string } | null>(null);

    const { data: selectedVehicleRouteNodes } = useRouteNodes({
        routeId: selectedVehicle?.rid ?? null
    });

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
                        node.lng / 1e6,
                        node.lat / 1e6,
                    ]) as [number, number][],
                },
                properties: { stroke: color },
            };
        })
        .filter((feature): feature is NonNullable<typeof feature> => feature !== null);

    const geoJsonData = features.length > 0 ? { type: "FeatureCollection" as const, features } : null;

    let selectedVehicleGeoJson = null;
    if (selectedVehicle && selectedVehicleRouteNodes && selectedVehicleRouteNodes.length > 1) {
        const color = config.routes.find(rt => rt.type === selectedVehicle.rtype)?.color || 'gray';
        selectedVehicleGeoJson = {
            type: "FeatureCollection" as const,
            features: [
                {
                    type: "Feature" as const,
                    geometry: {
                        type: "LineString" as const,
                        coordinates: selectedVehicleRouteNodes.map(node => [
                            node.lng / 1e6,
                            node.lat / 1e6,
                        ]) as [number, number][],
                    },
                    properties: { stroke: color },
                },
            ],
        };
    }

    const debouncedOnBoundsChanged = useMemo(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        return ({ center, zoom }: { center: [number, number]; zoom: number }) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                onCenterChange?.(center, zoom);
            }, 100);
        };
    }, [onCenterChange]);

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

                {selectedVehicleGeoJson && (
                    <GeoJson
                        data={selectedVehicleGeoJson}
                        styleCallback={(feature: { properties: { stroke: any; }; }) => ({
                            stroke: feature.properties?.stroke,
                            strokeWidth: 5,
                            strokeOpacity: 0.8,
                            fill: "none",
                        })}
                    />
                )}

                {vehiclePositions && vehiclePositions.anims.map(anim =>
                    <Overlay
                        key={`${anim.id}-${anim.lasttime}`}
                        anchor={[anim.lat / 1e6, anim.lon / 1e6]}
                    >
                        <div
                            className="vehicle-marker"
                            style={{
                                backgroundColor: config.routes.find(r => r.type === anim.rtype)?.color || 'gray',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (selectedVehicle?.rid === anim.rid) {
                                    setSelectedVehicle(null);
                                } else {
                                    setSelectedVehicle({ rid: anim.rid, rtype: anim.rtype });
                                }
                            }}
                        >
                            {anim.rnum}
                        </div>
                    </Overlay>
                )}

                {selectedStation && (
                    <Overlay
                        key="station-marker"
                        anchor={[selectedStation.lat / 1e6, selectedStation.lng / 1e6]}
                    >
                        <div className="station-marker" />
                    </Overlay>
                )}

                {selectedStation && (
                    <Overlay
                        key="station-popup"
                        anchor={[selectedStation.lat / 1e6, selectedStation.lng / 1e6]}
                        offset={[420, 340]}
                    >
                        <StationPopup
                            stationId={selectedStation.id}
                            stationName={selectedStation.name}
                            onDeselect={onStationDeselect}
                        />
                    </Overlay>
                )}
            </Map>

            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
                {routeNodes.some(rd => rd.isLoading) && <p>Загрузка маршрутов...</p>}
                {!vehiclePositions && rids && <p>Загрузка позиций транспорта...</p>}
            </div>
        </div>
    )
}