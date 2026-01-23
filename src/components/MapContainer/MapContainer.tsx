import { GeoJson, Map as PigeonMap, Overlay } from "pigeon-maps";
import { Suspense, useMemo, memo, useRef } from "react";
import "./MapContainer.css";
import type { Route, SelectedRoute, SelectedStation, SelectedVehicle } from "@/types/transport";
import { MemoizedStationPopup } from "@components/MapContainer/StationPopup";
import { useMapData } from "@/hooks/useMapData";
import { VehicleCanvasLayer } from "./VehicleCanvasLayer";
import { ForecastPopupStation } from "./ForecastPopupStation";
import { useMapControls } from "@/hooks/useMapControls";
import { normalizeCoordinate } from "@/utils/coordinates";
import { Spinner } from "@/components/Spinner";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { useMapViewport } from "@/hooks/useMapViewport";
import { useMapInteractions } from "@/hooks/useMapInteractions";
import { createRouteColorsMap } from "@/services/routeService";
import { filterVisibleVehicles, limitRenderedVehicles } from "@/services/vehicleService";
import { VehicleMarkersLegend } from "./VehicleMarkersLegend";

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
    const { debouncedOnBoundsChanged } = useMapControls(onCenterChange);
    const containerRef = useRef<HTMLDivElement>(null);

    const {
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

    const showRoutesLoading = useDelayedLoading(isLoading.routes);
    const showVehiclesLoading = useDelayedLoading(isLoading.vehicles);
    const showForecastsLoading = useDelayedLoading(isLoading.forecasts);

    const {
        mapWidth,
        mapHeight,
        currentZoom,
        viewportBounds,
        handleBoundsChanged,
    } = useMapViewport({
        initialCenter,
        initialZoom,
        containerRef,
        debouncedOnBoundsChanged,
    });

    const { handleVehicleClick, handleForecastClick } = useMapInteractions({
        selectedVehicle,
        setSelectedVehicle,
        onStationDeselect,
        closeStationPopup,
        onCenterChange,
        currentZoom,
        openForecastStationPopup,
    });

    const routeColorsMap = useMemo(() => createRouteColorsMap(), []);

    const selectedVehicleGeoJsonStyleCallback = useMemo(() => (feature: { properties?: { stroke?: string } }) => ({
        stroke: feature.properties?.stroke,
        strokeWidth: 5,
        strokeOpacity: 0.8,
        fill: "none",
    }), []);

    const visibleVehicles = useMemo(() => {
        return filterVisibleVehicles(vehicles, viewportBounds, selectedVehicle);
    }, [vehicles, viewportBounds, selectedVehicle]);

    const renderedVehicles = useMemo(() => {
        return limitRenderedVehicles(visibleVehicles, currentZoom);
    }, [visibleVehicles, currentZoom]);

    return (
        <div className="map-container" ref={containerRef}>
            <PigeonMap
                defaultCenter={initialCenter}
                defaultZoom={initialZoom}
                onBoundsChanged={handleBoundsChanged}
                width={mapWidth}
                height={mapHeight}
                key={`${initialCenter[0]}-${initialCenter[1]}-${initialZoom}`}
                data-testid="pigeon-map"
            >
                {selectedVehicleGeoJson && (
                    <GeoJson
                        data={selectedVehicleGeoJson}
                        styleCallback={selectedVehicleGeoJsonStyleCallback}
                    />
                )}

                <VehicleCanvasLayer
                    vehicles={renderedVehicles}
                    routeColorsMap={routeColorsMap}
                    selectedVehicleId={selectedVehicle?.id ?? null}
                    onVehicleClick={handleVehicleClick}
                />

                {sortedForecasts && sortedForecasts.length > 0 && !activeSelectedStation &&
                    sortedForecasts.map((forecast, index) => (
                        <Overlay
                            key={`forecast-${selectedVehicle?.id}-${forecast.stid}-${index}`}
                            anchor={[normalizeCoordinate(forecast.lat0), normalizeCoordinate(forecast.lng0)]}
                        >
                            <ForecastPopupStation
                                arrt={forecast.arrt}
                                stid={forecast.stid}
                                stname={forecast.stname}
                                lat0={forecast.lat0}
                                lng0={forecast.lng0}
                                onForecastClick={handleForecastClick}
                            />
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
                            <Suspense fallback={<Spinner size="sm" text="Загрузка..." />}>
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

            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {showRoutesLoading && <Spinner size="sm" text="Загрузка маршрутов..." inline variant="light" />}
                {showVehiclesLoading && <Spinner size="sm" text="Загрузка ТС..." inline variant="light" />}
                {showForecastsLoading && selectedVehicle && <Spinner size="sm" text="Загрузка прогнозов..." inline variant="light" />}
            </div>

            <VehicleMarkersLegend />
        </div>
    );
}

export const MapContainer = memo(MapContainerComponent);
