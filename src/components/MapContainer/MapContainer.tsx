import { GeoJson, Map as PigeonMap, Overlay } from "pigeon-maps";
import config from "@config";
import { Suspense, useMemo, memo, useState, useEffect, useCallback, useRef } from "react";
import "./MapContainer.css";
import type { Route, SelectedRoute, SelectedStation, SelectedVehicle, TransportType } from "@/types/transport";
import { MemoizedStationPopup } from "@components/MapContainer/StationPopup";
import { useMapData } from "@/hooks/useMapData";
import { VehicleCanvasLayer } from "./VehicleCanvasLayer";
import { ForecastPopupStation } from "./ForecastPopupStation";
import { useMapControls } from "@/hooks/useMapControls";
import { normalizeCoordinate } from "@/utils/coordinates";
import { calculateViewportBounds, isPointInViewport } from "@/services/viewport";
import { Spinner } from "@/components/Spinner";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

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
    const [mapWidth, setMapWidth] = useState(window.innerWidth);
    const [mapHeight, setMapHeight] = useState(window.innerHeight);
    const [currentCenter, setCurrentCenter] = useState<[number, number]>(initialCenter);
    const [currentZoom, setCurrentZoom] = useState<number>(initialZoom);

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

    useEffect(() => {
        setCurrentCenter(initialCenter);
        setCurrentZoom(initialZoom);
    }, [initialCenter, initialZoom]);

    const [viewportBounds, setViewportBounds] = useState(() =>
        calculateViewportBounds(initialCenter, initialZoom, window.innerWidth, window.innerHeight)
    );

    const boundsUpdateTimeoutRef = useRef<number | null>(null);

    const handleBoundsChanged = useCallback(({ center, zoom }: { center: [number, number]; zoom: number }) => {
        setCurrentCenter(center);
        setCurrentZoom(zoom);

        if (boundsUpdateTimeoutRef.current !== null) {
            cancelAnimationFrame(boundsUpdateTimeoutRef.current);
        }

        boundsUpdateTimeoutRef.current = requestAnimationFrame(() => {
            const bounds = calculateViewportBounds(center, zoom, mapWidth, mapHeight);
            setViewportBounds(bounds);
            boundsUpdateTimeoutRef.current = null;
        });

        debouncedOnBoundsChanged({ center, zoom });
    }, [debouncedOnBoundsChanged, mapWidth, mapHeight]);

    useEffect(() => {
        return () => {
            if (boundsUpdateTimeoutRef.current !== null) {
                cancelAnimationFrame(boundsUpdateTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMapWidth(rect.width);
                setMapHeight(rect.height);
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        const bounds = calculateViewportBounds(currentCenter, currentZoom, mapWidth, mapHeight);
        setViewportBounds(bounds);
    }, [currentCenter, currentZoom, mapWidth, mapHeight]);

    const handleVehicleClick = useCallback((vehicle: { id: string; rid: number; rtype: string }) => {
        closeStationPopup();
        onStationDeselect();

        if (selectedVehicle?.id === vehicle.id) {
            setSelectedVehicle(null);
        } else {
            setSelectedVehicle({
                id: vehicle.id,
                rid: vehicle.rid,
                rtype: vehicle.rtype as TransportType,
            });
        }
    }, [selectedVehicle, setSelectedVehicle, onStationDeselect, closeStationPopup]);

    const handleForecastClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();

        const target = e.currentTarget;
        const stid = Number(target.dataset.stid);
        const stname = target.dataset.stname!;
        const lat0 = Number(target.dataset.lat0);
        const lng0 = Number(target.dataset.lng0);

        onStationDeselect();
        onCenterChange?.([normalizeCoordinate(lat0), normalizeCoordinate(lng0)], currentZoom);
        openForecastStationPopup({
            id: stid,
            name: stname,
            lat: lat0,
            lng: lng0,
        });
    }, [onStationDeselect, onCenterChange, currentZoom, openForecastStationPopup]);

    const routeColorsMap = useMemo(() => {
        const map = new Map<string, string>();
        config.routes.forEach(rt => {
            map.set(rt.type, rt.color);
        });
        return map;
    }, []);

    const selectedVehicleGeoJsonStyleCallback = useMemo(() => (feature: { properties?: { stroke?: string } }) => ({
        stroke: feature.properties?.stroke,
        strokeWidth: 5,
        strokeOpacity: 0.8,
        fill: "none",
    }), []);

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
        </div>
    );
}

export const MapContainer = memo(MapContainerComponent);
