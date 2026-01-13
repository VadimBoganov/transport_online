import { GeoJson, Map as PigeonMap, Overlay } from "pigeon-maps";
import config from "@config";
import { Suspense, useMemo, memo } from "react";
import "./MapContainer.css";
import type { Route, SelectedRoute, SelectedStation, SelectedVehicle, TransportType } from "@/types/transport";
import { MemoizedStationPopup } from "@components/MapContainer/StationPopup";
import { formatArrivalMinutes } from "@/services/forecastService";
import { useMapData } from "@/hooks/useMapData";
import { VehicleMarker } from "./VehicleMarker";
import { useVehicleSelection } from "@/hooks/useVehicleSelection";
import { useMapControls } from "@/hooks/useMapControls";
import { normalizeCoordinate } from "@/utils/coordinates";

interface MapViewProps {
    center: [number, number];
    zoom: number;
    onCenterChange?: (center: [number, number], zoom: number) => void;
}

interface MapContainerProps {
    selectedRoutes: SelectedRoute[];
    routes: Route[];
    mapView: MapViewProps;
    selectedStation: SelectedStation | null;
    selectedVehicle: SelectedVehicle | null;
    onStationDeselect: () => void;
    setSelectedVehicle: (vehicle: SelectedVehicle | null) => void;
}

function MapContainerComponent({
    selectedRoutes,
    routes,
    mapView,
    selectedStation,
    selectedVehicle,
    onStationDeselect,
    setSelectedVehicle
}: MapContainerProps) {
    const { center, zoom, onCenterChange } = mapView;
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

    const routeColorsMap = useMemo(() => {
        const map = new Map<string, string>();
        config.routes.forEach(rt => {
            map.set(rt.type, rt.color);
        });
        return map;
    }, []);

    const routeGeoJsonStyleCallback = useMemo(() => (feature: { properties?: { stroke?: string } }) => ({
        stroke: feature.properties?.stroke,
        strokeWidth: 4,
        fill: "none",
    }), []);

    const selectedVehicleGeoJsonStyleCallback = useMemo(() => (feature: { properties?: { stroke?: string } }) => ({
        stroke: feature.properties?.stroke,
        strokeWidth: 5,
        strokeOpacity: 0.8,
        fill: "none",
    }), []);

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
                        styleCallback={routeGeoJsonStyleCallback}
                    />
                )}

                {selectedVehicleGeoJson && (
                    <GeoJson
                        data={selectedVehicleGeoJson}
                        styleCallback={selectedVehicleGeoJsonStyleCallback}
                    />
                )}

                {vehicles.map((anim) => (
                    <Overlay
                        key={`${anim.id}-${anim.rtype}`}
                        anchor={[normalizeCoordinate(anim.lat), normalizeCoordinate(anim.lon)]}
                    >
                        <VehicleMarker
                            rnum={anim.rnum}
                            dir={anim.dir}
                            rtype={anim.rtype}
                            color={routeColorsMap.get(anim.rtype) || 'gray'}
                            onClick={handleVehicleClick(anim.rid, anim.id, anim.rtype as TransportType)}
                            isSelected={selectedVehicle?.id === anim.id}
                        />
                    </Overlay>
                ))}

                {sortedForecasts && !activeSelectedStation &&
                    sortedForecasts.map((forecast, index) => (
                        <Overlay
                            key={`forecast-${selectedVehicle?.id}-${forecast.stid}-${index}`}
                            anchor={[normalizeCoordinate(forecast.lat0), normalizeCoordinate(forecast.lng0)]}
                        >
                            <div
                                className="forecast-popup-station"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStationDeselect();
                                    onCenterChange?.([normalizeCoordinate(forecast.lat0), normalizeCoordinate(forecast.lng0)], zoom);
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
                        anchor={[normalizeCoordinate(activeSelectedStation.lat), normalizeCoordinate(activeSelectedStation.lng)]}
                    >
                        <div className="station-marker" />
                    </Overlay>
                )}

                {activeSelectedStation && (
                    <Overlay
                        key="station-popup"
                        anchor={[normalizeCoordinate(activeSelectedStation.lat), normalizeCoordinate(activeSelectedStation.lng)]}
                    >
                        <div className="wrapper">
                            <Suspense fallback={<div className="popup-skeleton">Загрузка...</div>}>
                                <MemoizedStationPopup
                                    stationId={activeSelectedStation.id}
                                    stationName={activeSelectedStation.name}
                                    onDeselect={() => {
                                        closeStationPopup();
                                        onStationDeselect();
                                    }}
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

export const MapContainer = memo(MapContainerComponent);
