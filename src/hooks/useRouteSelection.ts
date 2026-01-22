import { useCallback, useState } from "react";
import type { Route, SelectedRoute, TransportType } from "@/types/transport";

interface UseRouteSelectionProps {
    routes: Route[];
    selectedRoutes: SelectedRoute[];
    onRoutesChange: (routes: Array<{ id: number; type: TransportType }>) => void;
}

interface UseRouteSelectionResult {
    activeTransportType: TransportType | null;
    setActiveTransportType: (type: TransportType | null) => void;
    handleRouteToggle: (type: TransportType, num: string) => void;
    handleSelectAllOfType: (type: TransportType) => void;
}

export const useRouteSelection = ({
    routes,
    selectedRoutes,
    onRoutesChange,
}: UseRouteSelectionProps): UseRouteSelectionResult => {
    const [activeTransportType, setActiveTransportType] = useState<TransportType | null>(null);

    const handleRouteToggle = useCallback(
        (type: TransportType, num: string) => {
            const routesWithSameNum = routes.filter((r) => r.num === num && r.type === type);

            const isAnySelected = selectedRoutes.some((sr) =>
                routesWithSameNum.some((r) => r.id === sr.id)
            );

            let updated: Array<{ id: number; type: TransportType }>;

            if (isAnySelected) {
                updated = selectedRoutes.filter(
                    (sr) => !routesWithSameNum.some((r) => r.id === sr.id)
                );
            } else {
                updated = [
                    ...selectedRoutes,
                    ...routesWithSameNum.map((r) => ({ id: r.id, type: r.type as TransportType })),
                ];
            }

            onRoutesChange(updated);

            if (activeTransportType) {
                setActiveTransportType(null);
            }
        },
        [routes, selectedRoutes, onRoutesChange, activeTransportType]
    );

    const handleSelectAllOfType = useCallback(
        (type: TransportType) => {
            if (activeTransportType === type) {
                const remainingRoutes = selectedRoutes.filter((sr) => sr.type !== type);
                onRoutesChange(remainingRoutes);
                setActiveTransportType(null);
                return;
            }

            const typeRoutes = routes.filter((r) => r.type === type);
            const newSelected = typeRoutes.map((r) => ({ id: r.id, type: r.type as TransportType }));

            onRoutesChange(newSelected);
            setActiveTransportType(type);
        },
        [routes, selectedRoutes, onRoutesChange, activeTransportType]
    );

    return {
        activeTransportType,
        setActiveTransportType,
        handleRouteToggle,
        handleSelectAllOfType,
    };
};
