import { GeoJson, Map as PigeonMap, Overlay } from "pigeon-maps"
import config from "@config"
import { useCallback, useEffect, useMemo, useState } from "react"
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
    const [mapWidth, setMapWidth] = useState<number>(1024);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleResize = () => {
                setMapWidth(window.innerWidth);
            };
            handleResize();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);


    const routeNodes = useRouteNodesBatch(selectedRoutes);
    const routeNodesMap = useMemo(() => {
        const map = new Map<number, typeof routeNodes[number]['data']>();
        routeNodes.forEach((result, index) => {
            if (result?.data && selectedRoutes[index]?.id) {
                map.set(selectedRoutes[index].id, result.data);
            }
        });
        return map;
    }, [routeNodes, selectedRoutes]);

    const activeRoutes = selectedRoutes.length > 0 ? selectedRoutes : routes || [];
    const rids = activeRoutes.length > 0 ? activeRoutes.map(r => `${r.id}-0`).join(',') : null;
    const { data: vehiclePositions, isLoading } = useVehiclePositions(rids);

    const [selectedVehicle, setSelectedVehicle] = useState<{ rid: number; rtype: string } | null>(null);

    const { data: selectedVehicleRouteNodes } = useRouteNodes({
        routeId: selectedVehicle?.rid ?? null
    });

    const features = activeRoutes
        .map((route) => {
            const data = routeNodesMap.get(route.id);
            if (!data || data.length < 2) return null;

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

    const geoJsonData = useMemo(() =>
        features.length > 0 ? ({ type: "FeatureCollection" as const, features }) : null,
        [features]
    );

    const selectedVehicleGeoJson = useMemo(() => {
        if (!selectedVehicle || !selectedVehicleRouteNodes || selectedVehicleRouteNodes.length <= 1) {
            return null;
        }
        const color = config.routes.find(rt => rt.type === selectedVehicle.rtype)?.color || 'gray';
        return {
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
    }, [selectedVehicle, selectedVehicleRouteNodes]);

    useEffect(() => {
        setSelectedVehicle(null);
    }, [selectedRoutes]);

    const debouncedOnBoundsChanged = useCallback(() => {
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
            <PigeonMap
                center={center}
                zoom={zoom}
                onBoundsChanged={debouncedOnBoundsChanged}
                defaultWidth={mapWidth}
            >
                {geoJsonData && (
                    <GeoJson
                        data={geoJsonData}
                        styleCallback={(feature: { properties?: { stroke?: string } }) => ({
                            stroke: feature.properties?.stroke,
                            strokeWidth: 4,
                            fill: "none",
                        })}
                    />
                )}

                {selectedVehicleGeoJson && (
                    <GeoJson
                        data={selectedVehicleGeoJson}
                        styleCallback={(feature: { properties?: { stroke?: string } }) => ({
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
                    >
                        <div className="wrapper">
                            <StationPopup
                                stationId={selectedStation.id}
                                stationName={selectedStation.name}
                                onDeselect={onStationDeselect}
                            />
                        </div>
                    </Overlay>
                )}
            </PigeonMap>

            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
                {routeNodes.some(rd => rd.isLoading) && <p>Загрузка маршрутов...</p>}
                {isLoading && <p>Загрузка позиций транспорта...</p>}
            </div>
        </div>
    )
}