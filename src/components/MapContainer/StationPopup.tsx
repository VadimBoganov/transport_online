import { Overlay } from "pigeon-maps";
import useStationForecast from "@/hooks/useStationForecast";
import type { Forecast } from "@/hooks/useStationForecast";
import "./StationPopup.css";
import { useRef, useEffect } from "react";

interface StationPopupProps {
    lat: number;
    lng: number;
    stationId: number;
    stationName: string;
    onDeselect: () => void;
}

export function StationPopup({
    lat,
    lng,
    stationId,
    stationName,
    onDeselect
}: StationPopupProps) {
    const { data: forecasts, isLoading: forecastsLoading } = useStationForecast({ stationId });

    const popupRef = useRef<HTMLDivElement>(null);
    const tbodyRef = useRef<HTMLDivElement>(null);

    const groupedForecasts = forecasts?.reduce((acc, forecast) => {
        const key = `${forecast.rnum}-${forecast.rtype}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(forecast);
        return acc;
    }, {} as Record<string, Forecast[]>);

    const routeSummaries = groupedForecasts
        ? Object.values(groupedForecasts).map((group) => {
            const sorted = group.sort((a, b) => a.arrt - b.arrt);
            return { current: sorted[0] || null, next: sorted[1] || null };
        })
        : [];

    useEffect(() => {
        const container = popupRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            const target = e.target as HTMLElement;
            const isInsideScrollContainer = tbodyRef.current?.contains(target);

            if (!isInsideScrollContainer) return;

            e.preventDefault();

            const { deltaY } = e;
            const scrollContainer = tbodyRef.current;
            if (!scrollContainer) return;

            const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
            const newScrollTop = scrollContainer.scrollTop + deltaY;
            scrollContainer.scrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));

            e.stopPropagation();
        };

        container.addEventListener("wheel", handleWheel, { capture: true, passive: false });

        return () => {
            container.removeEventListener("wheel", handleWheel, { capture: true });
        };
    }, []);

    return (
        <Overlay anchor={[lat / 1e6, lng / 1e6]} offset={[0, -40]}>
            <div ref={popupRef} className="station-popup">
                <h4>{stationName}</h4>

                {forecastsLoading ? (
                    <p>Загрузка прогнозов...</p>
                ) : routeSummaries.length === 0 ? (
                    <p>Нет данных о прибытии</p>
                ) : (
                    <div className="forecast-container">
                        <table className="forecast-table">
                            <thead>
                                <tr>
                                    <th>Маршрут</th>
                                    <th>Куда</th>
                                    <th>Прибытие</th>
                                </tr>
                            </thead>
                        </table>

                        <div ref={tbodyRef} className="tbody-container">
                            <table className="forecast-table">
                                <tbody>
                                    {routeSummaries.map((route, i) => {
                                        const { current, next } = route;
                                        if (!current) return null;

                                        return (
                                            <tr key={i}>
                                                <td>
                                                    <strong>{current.rtype}-{current.rnum}</strong>
                                                </td>
                                                <td>{current.where || '—'}</td>
                                                <td>
                                                    {Math.round(current.arrt / 60)} мин
                                                    {next ? (
                                                        <><br /><small>→ {Math.round(next.arrt / 60)} мин</small></>
                                                    ) : <><br /><small>→ отсутствует</small></>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <button onClick={onDeselect} className="close-button">Закрыть</button>
            </div>
        </Overlay>
    );
}
