import { useMemo, useEffect, useState } from "react";
import { useRouteNodesBatch } from "@/hooks/useRouteNodesBatch";
import { useVehiclePositions } from "@/hooks/useVehiclePositions";
import { useRouteNodes } from "@/hooks/useRouteNodes";
import useVehicleForecasts from "@/hooks/useVehicleForecasts";

import { buildRouteNodesMap, buildRouteGeoJSON, getActiveRoutes } from "@/services/routeService";
import { filterVehiclesBySelectedRoutes } from "@/services/vehicleFilterService";
import { processForecasts, formatArrivalMinutes } from "@/services/forecastService";
import { useStationPopup } from "@/hooks/useStationPopup";

import type { Route } from "@/hooks/useRoutes";
import type { Animation } from "@/hooks/useVehiclePositions";
import config from "@config";
import type { SelectedRoute } from "@/components/MapContainer/MapContainer";
import type { Station } from "./useStations";

interface UseMapDataProps {
    selectedRoutes: SelectedRoute[];
    routes: Route[];
    selectedStation: Station | null;
    onStationDeselect: () => void;
}

export interface UseMapDataResult {
    // Геометрия
    geoJsonData: any; // GeoJSON.FeatureCollection
    selectedVehicleGeoJson: any | null;
    // Транспорт
    vehicles: Animation[];
    selectedVehicle: { id: string; rid: number; rtype: string } | null;
    setSelectedVehicle: (v: Animation | null) => void;
    // Прогнозы
    sortedForecasts: ReturnType<typeof processForecasts>;
    formatArrivalMinutes: (arrt: number) => number;
    // Станция
    activeSelectedStation: Station | null;
    closeStationPopup: () => void;
    openForecastStationPopup: (station: Station) => void;
    // Загрузка
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
    onStationDeselect,
}: UseMapDataProps): UseMapDataResult => {
    // === Состояние выбранного ТС ===
    const [selectedVehicle, setSelectedVehicle] = useState<Animation | null>(null);

    // === Управление попапом станции ===
    const { activeSelectedStation, closeStationPopup, openForecastStationPopup } = useStationPopup({
        selectedStationFromProps: selectedStation,
        onDeselect: onStationDeselect,
    });

    // === Активные маршруты ===
    const activeRoutes = useMemo(() => {
        return getActiveRoutes(selectedRoutes, routes);
    }, [selectedRoutes, routes]);

    // === Узлы маршрутов (для линий) ===
    const routeNodes = useRouteNodesBatch(selectedRoutes);
    const { routeNodesMap, isLoading: nodesLoading } = useMemo(() => {
        return buildRouteNodesMap(routeNodes, selectedRoutes);
    }, [routeNodes, selectedRoutes]);

    // === GeoJSON маршрутов ===
    const geoJsonData = useMemo(() => {
        return buildRouteGeoJSON(activeRoutes, routeNodesMap);
    }, [activeRoutes, routeNodesMap]);

    // === Позиции транспорта ===
    const rids = activeRoutes.length > 0 ? activeRoutes.map(r => `${r.id}-0`).join(',') : null;
    const { data: vehiclePositions, isLoading: vehiclesLoading } = useVehiclePositions(rids);

    const vehicles = useMemo(() => {
        return filterVehiclesBySelectedRoutes(vehiclePositions?.anims, selectedRoutes);
    }, [vehiclePositions, selectedRoutes]);

    // === Узлы маршрута выбранного ТС (для его линии) ===
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

    // === Сброс выбранного ТС при смене маршрутов ===
    useEffect(() => {
        setSelectedVehicle(null);
    }, [selectedRoutes]);

    return {
        // Геометрия
        geoJsonData,
        selectedVehicleGeoJson,
        // Транспорт
        vehicles,
        selectedVehicle,
        setSelectedVehicle,
        // Прогнозы
        sortedForecasts,
        formatArrivalMinutes,
        // Станция
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
