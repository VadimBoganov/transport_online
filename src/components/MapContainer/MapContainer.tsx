import { GeoJson, Map as PigeonMap, Overlay } from "pigeon-maps";
import config from "@config";
import { Suspense } from "react";
import "./MapContainer.css";
import type { Route, SelectedRoute, SelectedStation, SelectedVehicle, TransportType } from "@/types/transport"; // ✅ Обновлено
import { MemoizedStationPopup } from "@components/MapContainer/StationPopup";
import { formatArrivalMinutes } from "@/services/forecastService";
import { useMapData } from "@/hooks/useMapData";
import { VehicleMarker } from "./VehicleMarker";
import { useVehicleSelection } from "@/hooks/useVehicleSelection";
import { useMapControls } from "@/hooks/useMapControls";

interface MapContainerProps {
    selectedRoutes: SelectedRoute[];
    routes: Route[];
    center: [number, number];
    zoom: number;
    onCenterChange?: (center: [number, number], zoom: number) => void;
    selectedStation: SelectedStation | null;
    selectedVehicle: SelectedVehicle | null;
    onStationDeselect: () => void;
    setSelectedVehicle: (vehicle: SelectedVehicle | null) => void;
}

export function MapContainer({
    selectedRoutes,
    routes,
    center,
    zoom,
    onCenterChange,
    selectedStation,
    selectedVehicle,
    onStationDeselect,
    setSelectedVehicle
}: MapContainerProps) {
     const { mapWidth, debouncedOnBoundsChanged } = useMapControls(onCenterChange);

    const {
        geoJsonData,
        vehicles,
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
        selectedVehicle,
    });

    const { handleVehicleClick } = useVehicleSelection({
        selectedVehicle,
        setSelectedVehicle,
        onStationDeselect,
    });

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
                        key={`${anim.id}-${anim.rtype}`}
                        anchor={[anim.lat / 1e6, anim.lon / 1e6]}
                    >
                        <VehicleMarker
                            rnum={anim.rnum}
                            dir={anim.dir}
                            rtype={anim.rtype}
                            color={config.routes.find((r) => r.type === anim.rtype)?.color || 'gray'}
                            onClick={handleVehicleClick(anim.rid, anim.id, anim.rtype as TransportType)}
                            isSelected={selectedVehicle?.id === anim.id}
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
                                    onCenterChange?.([forecast.lat0 / 1e6, forecast.lng0 / 1e6], zoom);
                                    openForecastStationPopup({
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
                            <Suspense fallback={<div className="popup-skeleton">Загрузка...</div>}>
                                <MemoizedStationPopup
                                    stationId={activeSelectedStation.id}
                                    stationName={activeSelectedStation.name}
                                    onDeselect={closeStationPopup}
                                />
                            </Suspense>
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
