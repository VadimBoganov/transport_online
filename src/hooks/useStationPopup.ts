import { makeVehicleForecasts } from "@/services/forecastService";
import type { VehicleForecast } from "@/types/transport";
import { useEffect, useMemo, useRef } from "react";

interface UseStationPopupProps {
    forecasts: VehicleForecast[] | null;
}

export const useStationPopup = ({
    forecasts
}: UseStationPopupProps) => {
    const tbodyRef = useRef<HTMLDivElement>(null);

    const routeSummaries = useMemo(() => {
        return makeVehicleForecasts(forecasts || [])
    }, [forecasts]);

    useEffect(() => {
        const container = tbodyRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            const target = e.target as HTMLElement;
            const isInsideScrollContainer = tbodyRef.current?.contains(target);

            if (!isInsideScrollContainer) return;

            e.preventDefault();
            const { deltaY } = e;
            const maxScroll = container.scrollHeight - container.clientHeight;
            const newScrollTop = container.scrollTop + deltaY;
            container.scrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));
            e.stopPropagation();
        };

        container.addEventListener("wheel", handleWheel, { capture: true, passive: false });
        return () => {
            container.removeEventListener("wheel", handleWheel, { capture: true });
        };
    }, []);

    return {
        routeSummaries,
        tbodyRef
    };
};
