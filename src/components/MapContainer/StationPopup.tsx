import { Overlay } from "pigeon-maps";
import useStationForecast from "@/hooks/useStationForecast";
import type { Forecast } from "@/hooks/useStationForecast";
import "./StationPopup.css";

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
    const { data: forecasts, isLoading: forecastsLoading } = useStationForecast({
        stationId
    });

    const groupedForecasts = forecasts?.reduce((acc, forecast) => {
        const key = `${forecast.rnum}-${forecast.rtype}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(forecast);
        return acc;
    }, {} as Record<string, Forecast[]>);

    const routeSummaries = groupedForecasts
        ? Object.values(groupedForecasts).map((group) => {
            const sorted = group.sort((a, b) => a.arrt - b.arrt);
            const current = sorted[0] || null;
            const next = sorted[1] || null;
            return { current, next };
        })
        : [];

    return (
        <Overlay anchor={[lat / 1e6, lng / 1e6]} offset={[0, -40]}>
            <div className="station-popup">
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

                        <div
                            className="tbody-container"
                            onWheel={(e) => {
                                e.stopPropagation();
                            }}
                        >
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
                                                    ) : <><br /><small>→ отстутствует</small></>}
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
