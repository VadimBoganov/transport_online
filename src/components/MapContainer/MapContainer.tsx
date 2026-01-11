import { GeoJson, Map as PigeonMap, Overlay } from "pigeon-maps";
import config from "@config";
import { useCallback, useEffect, useState } from "react";
import "./MapContainer.css";
import type { Route } from "@/hooks/useRoutes";
import { StationPopup } from "@components/MapContainer/StationPopup";
import { formatArrivalMinutes } from "@/services/forecastService";
import type { Station } from "@/hooks/useStations";
import { useMapData } from "@/hooks/useMapData";
import { VehicleMarker } from "./VehicleMarker";

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
    selectedStation: Station | null;
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

    const {
        geoJsonData,
        vehicles,
        selectedVehicle,
        setSelectedVehicle,
        selectedVehicleGeoJson,
        sortedForecasts,
        activeSelectedStation,
        closeStationPopup,
        openForecastStationPopup,
        isLoading,
    } = useMapData({
        selectedRoutes,
        routes,
        selectedStation,
        onStationDeselect,
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleResize = () => setMapWidth(window.innerWidth);
            handleResize();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

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

                {vehicles.map((anim) => (
                    <Overlay
                        key={`${anim.id}-${anim.lasttime}`}
                        anchor={[anim.lat / 1e6, anim.lon / 1e6]}
                    >
                        <VehicleMarker
                            rnum={anim.rnum}
                            dir={anim.dir}
                            rtype={anim.rtype}
                            color={config.routes.find((r) => r.type === anim.rtype)?.color || 'gray'}
                            onClick={(e) => {
                                e.stopPropagation();
                                closeStationPopup();
                                if (selectedVehicle?.rid === anim.rid) {
                                    setSelectedVehicle(null);
                                } else {
                                    setSelectedVehicle({
                                        id: anim.id,
                                        rid: anim.rid,
                                        rtype: anim.rtype,
                                        lat: anim.lat,
                                        lon: anim.lon,
                                        dir: anim.dir,
                                        speed: anim.speed,
                                        lasttime: anim.lasttime,
                                        gos_num: anim.gos_num,
                                        rnum: anim.rnum,
                                        low_floor: anim.low_floor,
                                    });
                                }
                            }}
                            isSelected={selectedVehicle?.rid === anim.rid}
                        />
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
                                    openForecastStationPopup({
                                        id: forecast.stid,
                                        name: forecast.stname,
                                        lat: forecast.lat0,
                                        lng: forecast.lng0,
                                    } as Station);
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
                {isLoading.routes && <p>Загрузка маршрутов...</p>}
                {isLoading.vehicles && <p>Загрузка ТС...</p>}
                {isLoading.forecasts && selectedVehicle && <div className="forecast-popup">Загрузка прогнозов...</div>}
            </div>
        </div>
    );
}
