import { GeoJson, Map as PigeonMap, Overlay } from "pigeon-maps";
import config from "@config";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./MapContainer.css";
import { useRouteNodesBatch } from "@/hooks/useRouteNodesBatch";
import { useVehiclePositions } from "@/hooks/useVehiclePositions";
import type { Route } from "@/hooks/useRoutes";
import { StationPopup } from "@components/MapContainer/StationPopup";
import { useRouteNodes } from "@/hooks/useRouteNodes";
import useVehicleForecasts from "@/hooks/useVehicleForecasts";
import { buildRouteNodesMap, buildRouteGeoJSON, getActiveRoutes } from "@/services/routeService";
import { filterVehiclesBySelectedRoutes } from "@/services/vehicleFilterService";
import { formatArrivalMinutes, processForecasts } from "@/services/forecastService";

export interface SelectedRoute {
    id: number;
    type: "А" | "Т" | "М";
}

interface MapContainerProps {
    selectedRoutes: SelectedRoute[];
    routes: Route[];
    center: [number, number];
    zoom: number;
    onCenterChange?: (center: [number, number], zoom: number) => void;
    selectedStation: { lat: number; lng: number; id: number; name: string } | null;
    onStationDeselect: () => void;
}

export function MapContainer({
    selectedRoutes,
    routes,
    center,
    zoom,
    onCenterChange,
    selectedStation,
    onStationDeselect,
}: MapContainerProps) {
    const [mapWidth, setMapWidth] = useState<number>(1024);

    const [forecastSelectedStation, setForecastSelectedStation] = useState<{
        id: number;
        name: string;
        lat: number;
        lng: number;
    } | null>(null);

    useEffect(() => {
        if (selectedStation) {
            setForecastSelectedStation(null);
        }
    }, [selectedStation]);

    const activeSelectedStation = useMemo(() => {
        if (selectedStation) return selectedStation;
        return forecastSelectedStation;
    }, [selectedStation, forecastSelectedStation]);

    const closeStationPopup = () => {
        setForecastSelectedStation(null);
        onStationDeselect();
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleResize = () => setMapWidth(window.innerWidth);
            handleResize();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    const routeNodes = useRouteNodesBatch(selectedRoutes);

    const { routeNodesMap, isLoading: nodesLoading } = useMemo(() => {
        return buildRouteNodesMap(routeNodes, selectedRoutes);
    }, [routeNodes, selectedRoutes]);

    const activeRoutes = useMemo(() => {
        return getActiveRoutes(selectedRoutes, routes);
    }, [selectedRoutes, routes]);

    const geoJsonData = useMemo(() => {
        return buildRouteGeoJSON(activeRoutes, routeNodesMap);
    }, [activeRoutes, routeNodesMap]);

    const rids = activeRoutes.length > 0 ? activeRoutes.map(r => `${r.id}-0`).join(',') : null;
    const { data: vehiclePositions, isLoading: vehiclesLoading } = useVehiclePositions(rids);

    const [selectedVehicle, setSelectedVehicle] = useState<{ id: string; rid: number; rtype: string } | null>(null);

    const { data: selectedVehicleRouteNodes } = useRouteNodes({
        routeId: selectedVehicle?.rid ?? null,
    });

    const { data: forecasts, isLoading: forecastsLoading } = useVehicleForecasts({ vid: selectedVehicle?.id ?? null });

    const sortedForecasts = useMemo(() => {
        return processForecasts(forecasts);
    }, [forecasts]);

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

                {vehiclePositions &&
                    filterVehiclesBySelectedRoutes(vehiclePositions.anims, selectedRoutes).map((anim) => (
                        <Overlay
                            key={`${anim.id}-${anim.lasttime}`}
                            anchor={[anim.lat / 1e6, anim.lon / 1e6]}
                        >
                            <div
                                className="vehicle-marker"
                                style={{
                                    backgroundColor: config.routes.find((r) => r.type === anim.rtype)?.color || 'gray',
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (selectedVehicle?.rid === anim.rid) {
                                        setSelectedVehicle(null);
                                    } else {
                                        setSelectedVehicle({ id: anim.id, rid: anim.rid, rtype: anim.rtype });
                                    }
                                }}
                            >
                                {anim.rnum}
                            </div>
                        </Overlay>
                    ))}
                    
                {sortedForecasts && !activeSelectedStation &&
                    sortedForecasts.map((forecast, index) => (
                        <Overlay
                            key={`forecast-${selectedVehicle?.id}-${forecast.stid}-${index}`}
                            anchor={[forecast.lat0 / 1e6, forecast.lng0 / 1e6]}
                        >
                            <div
                                className="forecast-popup-station"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStationDeselect();
                                    setForecastSelectedStation({
                                        id: forecast.stid,
                                        name: forecast.stname,
                                        lat: forecast.lat0,
                                        lng: forecast.lng0,
                                    });
                                }}
                            >
                                <div className="forecast-time">
                                    <strong>{formatArrivalMinutes(forecast.arrt)} мин</strong>
                                </div>
                            </div>
                        </Overlay>
                    ))}

                {activeSelectedStation && (
                    <Overlay
                        key="station-marker"
                        anchor={[activeSelectedStation.lat / 1e6, activeSelectedStation.lng / 1e6]}
                    >
                        <div className="station-marker" />
                    </Overlay>
                )}

                {activeSelectedStation && (
                    <Overlay
                        key="station-popup"
                        anchor={[activeSelectedStation.lat / 1e6, activeSelectedStation.lng / 1e6]}
                    >
                        <div className="wrapper">
                            <StationPopup
                                stationId={activeSelectedStation.id}
                                stationName={activeSelectedStation.name}
                                onDeselect={closeStationPopup}
                            />
                        </div>
                    </Overlay>
                )}
            </PigeonMap>

            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
                {nodesLoading && <p>Загрузка маршрутов...</p>}
                {vehiclesLoading && <p>Загрузка позиций транспорта...</p>}
                {forecastsLoading && selectedVehicle && <div className="forecast-popup">Загрузка прогнозов...</div>}
            </div>
        </div>
    );
}
