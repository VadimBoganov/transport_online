import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouteNodesBatch } from "@/hooks/useRouteNodesBatch";
import { useVehiclePositions } from "@/hooks/useVehiclePositions";
import { useRouteNodes } from "@/hooks/useRouteNodes";
import useVehicleForecasts from "@/hooks/useVehicleForecasts";

import { buildRouteNodesMap, buildRouteGeoJSON, getActiveRoutes } from "@/services/routeService";
import { filterVehiclesBySelectedRoutes } from "@/services/vehicleFilterService";
import { processForecasts } from "@/services/forecastService";

import type { Route } from "@/hooks/useRoutes";
import type { Animation } from "@/hooks/useVehiclePositions";
import config from "@config";
import type { SelectedRoute } from "@/components/MapContainer/MapContainer";

interface UseMapDataProps {
    selectedRoutes: SelectedRoute[];
    routes: Route[] | undefined;
    selectedStation: { id: number; name: string; lat: number; lng: number } | null;
    selectedVehicle: { id: string; rid: number; rtype: string } | null;
}

export interface UseMapDataResult {
    // Геометрия
    geoJsonData: any | null;
    selectedVehicleGeoJson: any | null;
    // Транспорт
    vehicles: Animation[];
    // Прогнозы
    sortedForecasts: ReturnType<typeof processForecasts> | null;
    // Управление попапом остановки
    activeSelectedStation: { id: number; name: string; lat: number; lng: number } | null;
    closeStationPopup: () => void;
    openForecastStationPopup: (station: { id: number; name: string; lat: number; lng: number }) => void;
    // Состояние загрузки
    isLoading: {
        routes: boolean;
        vehicles: boolean;
        forecasts: boolean;
    };
}

export const useMapData = ({
    selectedRoutes,
    routes,
    selectedStation,
    selectedVehicle,
}: UseMapDataProps): UseMapDataResult => {
    const [activeSelectedStation, setActiveSelectedStation] = useState<UseMapDataResult['activeSelectedStation']>(null);

    const openForecastStationPopup = useCallback((station: { id: number; name: string; lat: number; lng: number }) => {
        setActiveSelectedStation(station);
    }, []);

    const closeStationPopup = useCallback(() => {
        setActiveSelectedStation(null);
    }, []);

    // === Активные маршруты ===
    const activeRoutes = useMemo(() => {
        if (!routes) return [];
        return getActiveRoutes(selectedRoutes, routes);
    }, [selectedRoutes, routes]);

    // === Узлы маршрутов ===
    const routeNodes = useRouteNodesBatch(selectedRoutes);
    const { routeNodesMap, isLoading: nodesLoading } = useMemo(() => {
        return buildRouteNodesMap(routeNodes, selectedRoutes);
    }, [routeNodes, selectedRoutes]);

    // === GeoJSON активных маршрутов ===
    const geoJsonData = useMemo(() => {
        return buildRouteGeoJSON(activeRoutes, routeNodesMap);
    }, [activeRoutes, routeNodesMap]);

    // === Позиции транспорта ===
    const rids = activeRoutes.length > 0 ? activeRoutes.map(r => `${r.id}-0`).join(',') : null;
    const { data: vehiclePositions, isLoading: vehiclesLoading } = useVehiclePositions(rids);

    const vehicles = useMemo(() => {
        return filterVehiclesBySelectedRoutes(vehiclePositions?.anims, selectedRoutes);
    }, [vehiclePositions, selectedRoutes]);

    // === GeoJSON для выбранного ТС ===
    const { data: selectedVehicleRouteNodes } = useRouteNodes({
        routeId: selectedVehicle?.rid ?? null,
    });

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

    // === Прогнозы для выбранного ТС ===
    const { data: forecasts, isLoading: forecastsLoading } = useVehicleForecasts({
        vid: selectedVehicle?.id ?? null,
    });

    const sortedForecasts = useMemo(() => {
        return processForecasts(forecasts);
    }, [forecasts]);

    useEffect(() => {
        if (selectedStation) {
            setActiveSelectedStation(selectedStation);
        }
    }, [selectedStation]);

    return {
        // Геометрия
        geoJsonData,
        selectedVehicleGeoJson,
        // Транспорт
        vehicles,
        // Прогнозы
        sortedForecasts,
        // Попап остановки
        activeSelectedStation,
        closeStationPopup,
        openForecastStationPopup,
        // Загрузка
        isLoading: {
            routes: nodesLoading,
            vehicles: vehiclesLoading,
            forecasts: forecastsLoading,
        },
    };
};
