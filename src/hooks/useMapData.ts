import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useRouteNodesBatch } from "@/hooks/useRouteNodesBatch";
import { useVehiclePositions } from "@/hooks/useVehiclePositions";
import { useRouteNodes } from "@/hooks/useRouteNodes";
import useVehicleForecasts from "@/hooks/useVehicleForecasts";

import { buildRouteNodesMap, buildRouteGeoJSON, getActiveRoutes } from "@/services/routeService";
import { filterVehiclesBySelectedRoutes } from "@/services/vehicleFilterService";
import { processForecasts } from "@/services/forecastService";

import type { Animation, Route, SelectedRoute, SelectedStation, SelectedVehicle } from "@/types/transport";
import config from "@config";

interface UseMapDataProps {
    selectedRoutes: SelectedRoute[];
    routes: Route[] | undefined;
    selectedStation: SelectedStation | null;
    selectedVehicle: SelectedVehicle | null;
}

export interface UseMapDataResult {
    geoJsonData: any | null;
    selectedVehicleGeoJson: any | null;
    vehicles: Animation[];
    sortedForecasts: ReturnType<typeof processForecasts> | null;
    activeSelectedStation: SelectedStation | null;
    closeStationPopup: () => void;
    openForecastStationPopup: (station: SelectedStation) => void;
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
    const [activeSelectedStation, setActiveSelectedStation] = useState<SelectedStation | null>(null);

    const openForecastStationPopup = useCallback((station: SelectedStation) => {
        setActiveSelectedStation(station);
    }, []);

    function closeStationPopup() {
        startTransition(() => {
            setActiveSelectedStation(null);
        });
    }

    const activeRoutes = useMemo(() => {
        if (!routes) return [];
        return getActiveRoutes(selectedRoutes, routes);
    }, [selectedRoutes, routes]);

    const routeNodes = useRouteNodesBatch(selectedRoutes);
    const { routeNodesMap, isLoading: nodesLoading } = useMemo(() => {
        return buildRouteNodesMap(routeNodes, selectedRoutes);
    }, [routeNodes, selectedRoutes]);

    const geoJsonData = useMemo(() => {
        return buildRouteGeoJSON(activeRoutes, routeNodesMap);
    }, [activeRoutes, routeNodesMap]);

    const rids = activeRoutes.length > 0 ? activeRoutes.map(r => `${r.id}-0`).join(',') : null;
    const { data: vehiclePositions, isLoading: vehiclesLoading } = useVehiclePositions(rids);

    const vehicles = useMemo(() => {
        return filterVehiclesBySelectedRoutes(vehiclePositions?.anims, selectedRoutes);
    }, [vehiclePositions, selectedRoutes]);

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
        geoJsonData,
        selectedVehicleGeoJson,
        vehicles,
        sortedForecasts,
        activeSelectedStation,
        closeStationPopup,
        openForecastStationPopup,
        isLoading: {
            routes: nodesLoading,
            vehicles: vehiclesLoading,
            forecasts: forecastsLoading,
        },
    };
};
