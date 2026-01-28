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

        let lastY: number | null = null;

        const isInsideScrollContainer = (target: EventTarget | null) =>
            !!(target && tbodyRef.current?.contains(target as Node));

        const handleTouchStart = (e: TouchEvent) => {
            if (!isInsideScrollContainer(e.target)) return;
            if (e.touches.length > 0) {
                lastY = e.touches[0].clientY;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isInsideScrollContainer(e.target)) return;
            if (e.touches.length === 0 || lastY === null) return;

            const currentY = e.touches[0].clientY;
            const deltaY = lastY - currentY;
            if (deltaY === 0) return;

            const maxScroll = container.scrollHeight - container.clientHeight;
            const newScrollTop = container.scrollTop + deltaY;

            if (
                (deltaY > 0 && container.scrollTop < maxScroll) ||
                (deltaY < 0 && container.scrollTop > 0)
            ) {
                e.preventDefault();
                e.stopPropagation();
                container.scrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));
                lastY = currentY;
            }
        };

        const handleTouchEnd = () => {
            lastY = null;
        };


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
        container.addEventListener("touchstart", handleTouchStart, { capture: true, passive: true });
        container.addEventListener("touchmove", handleTouchMove, { capture: true, passive: false });
        container.addEventListener("touchend", handleTouchEnd, { capture: true });
        container.addEventListener("touchcancel", handleTouchEnd, { capture: true });
        return () => {
            container.removeEventListener("wheel", handleWheel, { capture: true });
            container.removeEventListener("touchstart", handleTouchStart, { capture: true });
            container.removeEventListener("touchmove", handleTouchMove, { capture: true });
            container.removeEventListener("touchend", handleTouchEnd, { capture: true });
            container.removeEventListener("touchcancel", handleTouchEnd, { capture: true });

        };
    }, []);

    return {
        routeSummaries,
        tbodyRef
    };
};
