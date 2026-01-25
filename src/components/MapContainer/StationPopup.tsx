import useStationForecast from "@/hooks/useStationForecast";
import "./StationPopup.css";
import { startTransition } from "react";
import type { VehicleForecast } from "@/types/transport";
import React from "react";
import { useStationPopup } from "@/hooks/useStationPopup";
import { Spinner } from "@/components/Spinner";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

function StationPopupContent({ forecasts }: { forecasts: VehicleForecast[] | null }) {
    if (!forecasts || forecasts.length === 0) {
        return <p>Нет данных о прибытии</p>;
    }

    const {routeSummaries, tbodyRef} = useStationPopup({forecasts});

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
                                        ) : <><br /><small>→ нет ТС</small></>}
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
    const showLoading = useDelayedLoading(isLoading);

    return (
        <div className="station-popup">
            <h4>{stationName}</h4>

            {isLoading ? (
                showLoading ? (
                    <Spinner size="sm" text="Загрузка прогнозов..." />
                ) : null
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

export const MemoizedStationPopup = React.memo(StationPopup, (prev, next) => {
    return prev.stationId === next.stationId && prev.stationName === next.stationName;
});
