import { GeoJson, Map as PigeonMap, Overlay } from "pigeon-maps";
import config from "@config";
import { Suspense, useMemo, memo, useState, useEffect } from "react";
import "./MapContainer.css";
import type { Route, SelectedRoute, SelectedStation, SelectedVehicle, TransportType } from "@/types/transport";
import { MemoizedStationPopup } from "@components/MapContainer/StationPopup";
import { formatArrivalMinutes } from "@/services/forecastService";
import { useMapData } from "@/hooks/useMapData";
import { VehicleMarker } from "./VehicleMarker";
import { useVehicleSelection } from "@/hooks/useVehicleSelection";
import { useMapControls } from "@/hooks/useMapControls";
import { normalizeCoordinate } from "@/utils/coordinates";
import { calculateViewportBounds, isPointInViewport } from "@/utils/viewport";

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
    const { center: initialCenter, zoom: initialZoom, onCenterChange } = mapView;
    const { mapWidth, mapBounds, debouncedOnBoundsChanged } = useMapControls(onCenterChange);
    const [mapHeight, setMapHeight] = useState(600);
    const [currentCenter, setCurrentCenter] = useState<[number, number]>(initialCenter);
    const [currentZoom, setCurrentZoom] = useState<number>(initialZoom);
    
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
    
    useEffect(() => {
        setCurrentCenter(initialCenter);
        setCurrentZoom(initialZoom);
    }, [initialCenter, initialZoom]);
    
    const handleBoundsChanged = useMemo(() => {
        return ({ center, zoom }: { center: [number, number]; zoom: number }) => {
            setCurrentCenter(center);
            setCurrentZoom(zoom);
            debouncedOnBoundsChanged({ center, zoom });
        };
    }, [debouncedOnBoundsChanged]);

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

    const viewportBounds = useMemo(() => {
        return calculateViewportBounds(currentCenter, currentZoom, mapWidth, mapHeight);
    }, [currentCenter, currentZoom, mapWidth, mapHeight]);

    const visibleVehicles = useMemo(() => {
        if (vehicles.length === 0) return vehicles;
        
        return vehicles.filter((anim) => {
            if (selectedVehicle?.id === anim.id) return true;
            
            return isPointInViewport(anim.lat, anim.lon, viewportBounds);
        });
    }, [vehicles, viewportBounds, selectedVehicle]);

    const renderedVehicles = useMemo(() => {
        if (currentZoom < 12) {
            return visibleVehicles.slice(0, 150);
        }
        if (currentZoom < 14) {
            return visibleVehicles.slice(0, 300);
        }
        return visibleVehicles.slice(0, 500);
    }, [visibleVehicles, currentZoom]);

    return (
        <div className="map-container" ref={(el) => {
            if (el) {
                const height = el.clientHeight || 600;
                if (height !== mapHeight) {
                    setMapHeight(height);
                }
            }
        }}>
            <PigeonMap
                center={initialCenter}
                zoom={initialZoom}
                onBoundsChanged={handleBoundsChanged}
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

                {renderedVehicles.map((anim) => (
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
                                    onCenterChange?.([normalizeCoordinate(forecast.lat0), normalizeCoordinate(forecast.lng0)], currentZoom);
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
