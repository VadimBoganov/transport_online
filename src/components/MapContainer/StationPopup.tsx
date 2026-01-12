import useStationForecast from "@/hooks/useStationForecast";
import "./StationPopup.css";
import { useRef, useEffect, useMemo, startTransition } from "react";
import type { Forecast } from "@/types/transport";
import React from "react";

function StationPopupContent({ forecasts }: { forecasts: Forecast[] | null }) {
    const tbodyRef = useRef<HTMLDivElement>(null);

    const routeSummaries = useMemo(() => {
        if (!forecasts || forecasts.length === 0) return [];

        const grouped = forecasts.reduce((acc, forecast) => {
            const key = `${forecast.rnum}-${forecast.rtype}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(forecast);
            return acc;
        }, {} as Record<string, Forecast[]>);

        return Object.values(grouped)
            .map((group) => {
                const sorted = group.sort((a, b) => a.arrt - b.arrt);
                return { current: sorted[0] || null, next: sorted[1] || null };
            })
            .filter(item => item.current);
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
        return () => container.removeEventListener("wheel", handleWheel, { capture: true });
    }, []);

    if (!forecasts || forecasts.length === 0) {
        return <p>Нет данных о прибытии</p>;
    }

    return (
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
    );
}

interface StationPopupProps {
    stationId: number;
    stationName: string;
    onDeselect: () => void;
}

export function StationPopup({ stationId, stationName, onDeselect }: StationPopupProps) {
    const { data: forecasts, isLoading } = useStationForecast({ stationId });

    return (
        <div className="station-popup">
            <h4>{stationName}</h4>

            {isLoading ? (
                <p>Загрузка прогнозов...</p>
            ) : (
                <StationPopupContent forecasts={forecasts || null} />
            )}

            <button onClick={() => {
                startTransition(() => {
                    onDeselect();
                });
            }} className="close-button">Закрыть</button>
        </div>
    );
}

export const MemoizedStationPopup = React.memo(StationPopup);
