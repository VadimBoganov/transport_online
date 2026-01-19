import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouteNodesBatch } from "@/hooks/useRouteNodesBatch";
import { useVehiclePositions } from "@/hooks/useVehiclePositions";
import { useRouteNodes } from "@/hooks/useRouteNodes";
import useVehicleForecasts from "@/hooks/useVehicleForecasts";

import { buildRouteNodesMap, buildRouteGeoJSON, getActiveRoutes, makeRouteIdsString, type RouteGeoJSON } from "@/services/routeService";
import { buildSelectedVehicleGeoJSON, filterVehiclesBySelectedRoutes, type SelectedVehicleGeoJSON } from "@/services/vehicleService";
import { processForecasts } from "@/services/forecastService";
import { shouldOpenStationPopup } from "@/services/stationService";

import type { Animation, Route, SelectedRoute, SelectedStation, SelectedVehicle } from "@/types/transport";

interface UseMapDataProps {
    selectedRoutes: SelectedRoute[];
    routes: Route[] | undefined;
    selectedStation: SelectedStation | null;
    selectedVehicle: SelectedVehicle | null;
}

export interface UseMapDataResult {
    geoJsonData: RouteGeoJSON | null;
    selectedVehicleGeoJson: SelectedVehicleGeoJSON | null;
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

    const routeNodes = useRouteNodesBatch(selectedRoutes);
    const { data: selectedVehicleRouteNodes } = useRouteNodes({ routeId: selectedVehicle?.rid ?? null });

    const openForecastStationPopup = useCallback((station: SelectedStation) => {
        setActiveSelectedStation(station);
    }, []);

    const closeStationPopup = useCallback(() => {
        setActiveSelectedStation(null);
    }, []);

    const activeRoutes = useMemo(() => {
        if (!routes) return [];
        return getActiveRoutes(selectedRoutes, routes);
    }, [selectedRoutes, routes]);

    const { data: vehiclePositions, isLoading: vehiclesLoading } = useVehiclePositions(makeRouteIdsString(activeRoutes));

    const { routeNodesMap, isLoading: nodesLoading } = useMemo(() => {
        return buildRouteNodesMap(routeNodes, selectedRoutes);
    }, [routeNodes, selectedRoutes]);

    const geoJsonData = useMemo(() => {
        return buildRouteGeoJSON(activeRoutes, routeNodesMap);
    }, [activeRoutes, routeNodesMap]);

    const vehicles = useMemo(() => {
        return filterVehiclesBySelectedRoutes(vehiclePositions?.anims, selectedRoutes);
    }, [vehiclePositions, selectedRoutes]);

    const selectedVehicleGeoJson = useMemo(() => {
        return buildSelectedVehicleGeoJSON(selectedVehicle, selectedVehicleRouteNodes);
    }, [selectedVehicle, selectedVehicleRouteNodes]);

    const { data: forecasts, isLoading: forecastsLoading } = useVehicleForecasts({
        vid: selectedVehicle?.id ?? null,
    });

    const sortedForecasts = useMemo(() => {
        if (!selectedVehicle || !forecasts || forecasts.length === 0) {
            return null;
        }
        return processForecasts(forecasts);
    }, [forecasts, selectedVehicle]);

    useEffect(() => {
        if (selectedStation && shouldOpenStationPopup(selectedStation, activeSelectedStation)) {
            setActiveSelectedStation(selectedStation);
        }
    }, [selectedStation, activeSelectedStation]);

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
